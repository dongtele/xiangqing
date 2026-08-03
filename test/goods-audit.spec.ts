import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Goods, GoodsDraft, MerchantGoods } from '@/models';

/**
 * 商品审核规则（10 / 11 / 36）。
 *
 * 这一层是设计稿 98 屏之外补的，但规则要当接口契约用：
 * 哪些字段触发重审、重审期间顾客端看到什么，接真实后端后必须一致。
 *
 * 审核出结果是「读的时候按时间戳惰性结算」，所以测例直接改 `state.goodsReviewAt`
 * 把到期时间拨到过去，再读一次即可，不用等真实的 10 秒。
 */
type Resolve = <T>(key: string, payload: Record<string, unknown>) => Promise<T>;
type SaveResult = { ok: boolean; auditState: string };

let mockResolve: Resolve;
let state: { goodsReviewAt: Record<string, number> };
let goodsList: Goods[];

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('@/services/mock');
  mockResolve = mod.mockResolve;
  state = (mod as unknown as { state: typeof state }).state;
  ({ goodsList } = await import('@/services/mock/db'));
});

/** 把审核倒计时拨到过去，下一次读接口就会结算 */
function fastForward(id: string): void {
  state.goodsReviewAt[id] = Date.now() - 1;
}

const listOf = () =>
  mockResolve<{ list: MerchantGoods[] }>('GET /merchant/goods', {}).then((r) => r.list);
const rowOf = async (id: string) => (await listOf()).find((g) => g.id === id);
const draftOf = (id: string) => mockResolve<GoodsDraft>('GET /merchant/goods/detail', { id });
const save = (draft: GoodsDraft) =>
  mockResolve<SaveResult>('POST /merchant/goods/save', draft as unknown as Record<string, unknown>);

describe('新建商品必须过审', () => {
  it('提交后进入审核中，且顾客端菜单里还看不到', async () => {
    const draft = await mockResolve<GoodsDraft>('POST /merchant/goods/create', {});
    draft.name = '香辣鸡翅';
    draft.categoryId = 'c1';
    draft.categoryName = '招牌热菜';
    draft.price = 2800;
    draft.stock = 30;

    const res = await save(draft);
    expect(res.auditState).toBe('reviewing');

    const row = await rowOf(draft.id);
    expect(row?.auditState).toBe('reviewing');
    // 没过审就不能在售
    expect(row?.onSale).toBe(false);
    expect(goodsList.find((g) => g.id === draft.id)).toBeUndefined();
  });

  it('通过后才写进顾客端菜单', async () => {
    const draft = await mockResolve<GoodsDraft>('POST /merchant/goods/create', {});
    draft.name = '香辣鸡翅';
    draft.categoryId = 'c1';
    draft.categoryName = '招牌热菜';
    draft.price = 2800;
    await save(draft);

    fastForward(draft.id);
    const row = await rowOf(draft.id);
    expect(row?.auditState).toBe('approved');

    const live = goodsList.find((g) => g.id === draft.id);
    expect(live?.name).toBe('香辣鸡翅');
    expect(live?.price).toBe(2800);
  });

  it('名称含违禁词会被驳回并带上原因', async () => {
    const draft = await mockResolve<GoodsDraft>('POST /merchant/goods/create', {});
    draft.name = '店长推荐白酒套餐';
    draft.categoryId = 'c1';
    draft.categoryName = '招牌热菜';
    draft.price = 9900;
    await save(draft);

    fastForward(draft.id);
    const row = await rowOf(draft.id);
    expect(row?.auditState).toBe('rejected');
    expect(row?.auditReason).toContain('酒');
    expect(goodsList.find((g) => g.id === draft.id)).toBeUndefined();
  });

  it('驳回后改掉违禁词重新提交，回到审核中', async () => {
    const draft = await mockResolve<GoodsDraft>('POST /merchant/goods/create', {});
    draft.name = '店长推荐白酒套餐';
    draft.categoryId = 'c1';
    draft.categoryName = '招牌热菜';
    draft.price = 9900;
    await save(draft);
    fastForward(draft.id);
    await listOf();

    const rejected = await draftOf(draft.id);
    rejected.name = '店长推荐套餐';
    const res = await save(rejected);
    expect(res.auditState).toBe('reviewing');
  });
});

describe('改动已上架的商品', () => {
  it('改价触发重审，重审期间顾客端仍是旧价', async () => {
    const draft = await draftOf('g1');
    const oldPrice = goodsList.find((g) => g.id === 'g1')?.price;
    draft.price = 4200;

    const res = await save(draft);
    expect(res.auditState).toBe('reviewing');
    expect(goodsList.find((g) => g.id === 'g1')?.price).toBe(oldPrice);

    fastForward('g1');
    await listOf();
    expect(goodsList.find((g) => g.id === 'g1')?.price).toBe(4200);
  });

  it('只改库存不触发审核，且立即生效', async () => {
    const draft = await draftOf('g1');
    draft.stock = 88;

    const res = await save(draft);
    expect(res.auditState).toBe('approved');
    expect(goodsList.find((g) => g.id === 'g1')?.stock).toBe(88);
  });

  it('改规格也要重审', async () => {
    const draft = await draftOf('g1');
    draft.specGroups[0].options.push({ id: 'o_new', name: '超大份', priceDelta: 1500 });

    const res = await save(draft);
    expect(res.auditState).toBe('reviewing');
  });
});

describe('未过审的商品不能上架', () => {
  it('示例里被驳回的新品，切上架会被服务端拒绝', async () => {
    const res = await mockResolve<{ ok: boolean; message?: string }>(
      'POST /merchant/goods/onsale',
      { id: 'g_new_1', onSale: true }
    );
    expect(res.ok).toBe(false);
    expect(res.message).toContain('审核');
    expect((await rowOf('g_new_1'))?.onSale).toBe(false);
  });

  it('已过审的商品可以正常下架', async () => {
    const res = await mockResolve<{ ok: boolean }>('POST /merchant/goods/onsale', {
      id: 'g1',
      onSale: false,
    });
    expect(res.ok).toBe(true);
    expect((await rowOf('g1'))?.onSale).toBe(false);
  });
});
