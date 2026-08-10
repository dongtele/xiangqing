<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getCategoryRows, getGoodsDraft, saveGoodsDraft } from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { back, push, toast } from '@/utils/nav';
import { saleTimeText } from '@/utils/sale-time';
import type { CategoryRow, GoodsDraft, SpecGroup, SpecOption } from '@/models';

/** 11 · 编辑商品 / 发布商品：基础信息、图片、价格、规格、审核状态 */
const draft = ref<GoodsDraft | null>(null);
const categories = ref<CategoryRow[]>([]);
const catSheet = ref(false);
let goodsId = '';
const priceText = computed(() => (draft.value ? fen2yuan2(draft.value.price) : '0.00'));
const auditState = computed(() => draft.value?.auditState || 'approved');
const canToggleSale = computed(() => auditState.value === 'approved');
const saleText = computed(() => saleTimeText(draft.value?.saleTime));

const saveText = computed(() => {
  if (auditState.value === 'rejected' || auditState.value === 'draft') return '提交审核';
  return draft.value?.onSale ? '保存并上架' : '保存';
});

/** 「热销推荐」是按月售自动聚合的虚拟分类，不能往里挂商品 */
const categoryOptions = computed(() =>
  categories.value
    .filter((c) => !c.pinned)
    .map((c) => ({ value: c.id, label: c.name, sub: c.sub }))
);

onLoad((o) => {
  goodsId = (o && o.id) || '';
  // 新建统一走 99 发布商品（交付文档：10「＋发布」→ 99），11 只负责编辑已有商品
  if (!goodsId) uni.redirectTo({ url: '/pages/merchant/goods-publish/index' });
});

// 从 36 规格页返回后要拿到最新规格，所以每次 show 都重新取
onShow(async () => {
  if (!goodsId) return;
  const [res, rows] = await Promise.all([getGoodsDraft(goodsId), getCategoryRows()]);
  if (!res) {
    toast('商品不存在');
    back();
    return;
  }
  categories.value = rows;
  draft.value = res;
});

function editText(field: 'name', title: string): void {
  if (!draft.value) return;
  const current = draft.value[field];
  uni.showModal({
    title,
    editable: true,
    placeholderText: current || title,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const next = (res.content || '').trim();
      if (next) draft.value[field] = next;
    },
  });
}

/** 分类只能从 22 分类管理里已有的分类里选，不能手输——手输能打出顾客端根本没有的分类 */
function onPickCategory(id: string): void {
  const hit = categories.value.find((c) => c.id === id);
  if (!hit || !draft.value) return;
  draft.value.categoryId = hit.id;
  draft.value.categoryName = hit.name;
  catSheet.value = false;
}

/** 规格预览：定价组显示整价，加料这类加价组显示 +￥ */
/** 规格预览：定价档显示整价，加料这类加价组显示 +￥ */
function optionLabel(group: SpecGroup, option: SpecOption): string {
  if (!draft.value) return option.name;
  if (group.kind === 'price') {
    return `${option.name} ¥${fen2yuan2(option.price ?? draft.value.price)}`;
  }
  return option.priceDelta > 0 ? `${option.name} +¥${fen2yuan2(option.priceDelta)}` : option.name;
}

function editNumber(field: 'price' | 'stock', title: string): void {
  if (!draft.value) return;
  const current = field === 'price' ? fen2yuan2(draft.value.price) : String(draft.value.stock);
  uni.showModal({
    title,
    editable: true,
    placeholderText: current,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const value = Number(res.content);
      if (Number.isNaN(value) || value < 0) {
        toast('请输入正确的数值');
        return;
      }
      if (field === 'price') draft.value.price = Math.round(value * 100);
      else draft.value.stock = Math.round(value);
    },
  });
}

function onAddImage(): void {
  if (!draft.value) return;
  if (draft.value.images.filter(Boolean).length >= 5) {
    toast('最多 5 张商品图');
    return;
  }
  // 选好图去 63 裁剪，裁完写回草稿
  push(`/pages/merchant/image-crop/index?id=${goodsId}`);
}

async function onSave(): Promise<void> {
  if (!draft.value) return;
  if (!draft.value.name.trim()) {
    toast('请填写商品名称');
    return;
  }
  if (!draft.value.categoryId) {
    toast('请选择所属分类');
    return;
  }
  if (draft.value.price <= 0) {
    toast('请填写基础价格');
    return;
  }
  const res = await saveGoodsDraft(JSON.parse(JSON.stringify(draft.value)) as GoodsDraft);
  if (res.auditState === 'pending') {
    // 交付文档：提交审核后落到 100 审核进度
    toast('已提交审核', 'success');
    uni.redirectTo({ url: '/pages/merchant/goods-audit/index' });
    return;
  }
  toast(draft.value.onSale ? '已保存并上架' : '已保存（未上架）', 'success');
  back();
}

function onToggleSale(on: boolean): void {
  if (!draft.value) return;
  if (!canToggleSale.value) {
    toast(auditState.value === 'pending' ? '审核通过后才能上架' : '审核未通过，无法上架');
    return;
  }
  draft.value.onSale = on;
}
</script>

<template>
  <view v-if="draft" class="ge">
    <wf-nav-bar title="编辑商品" />

    <scroll-view class="ge__body" scroll-y>
      <!-- 审核状态：设计稿 98 屏之外新增的一层，商家要能看到自己的商品卡在哪 -->
      <view v-if="auditState === 'pending'" class="ge__audit ge__audit--reviewing">
        <text class="ge__audit-title">平台审核中</text>
        <text class="ge__audit-text"
          >预计 2 小时内出结果，结果会通过微信服务通知推送。审核期间顾客端展示的仍是上一个通过审核的版本。</text
        >
      </view>
      <view v-else-if="auditState === 'rejected'" class="ge__audit ge__audit--rejected">
        <text class="ge__audit-title">审核未通过</text>
        <text class="ge__audit-text">{{
          draft.auditIssues[0]?.title || '请修改后重新提交'
        }}</text>
        <text
          class="ge__audit-link tap"
          @tap="push(`/pages/merchant/goods-reject/index?id=${goodsId}`)"
          >查看逐项原因 ›</text
        >
      </view>

      <!-- 图片 -->
      <view class="card ge__images">
        <view v-for="(img, i) in draft.images.filter(Boolean)" :key="i" class="ge__img">
          <wf-thumb :src="img" :radius="24" />
        </view>
        <view class="ge__img-add tap" @tap="onAddImage">
          <text class="ge__img-plus">＋</text>
          <text class="ge__img-hint">添加图片 {{ draft.images.filter(Boolean).length }}/5</text>
        </view>
      </view>

      <!-- 基础信息 -->
      <view class="card card--flat">
        <view class="cell tap" @tap="editText('name', '商品名称')">
          <text class="ge__label">商品名称</text>
          <text class="ge__value" :class="{ 'ge__value--empty': !draft.name }">{{
            draft.name || '未填写'
          }}</text>
        </view>
        <view class="cell tap" @tap="catSheet = true">
          <text class="ge__label">所属分类</text>
          <text class="ge__value" :class="{ 'ge__value--empty': !draft.categoryName }"
            >{{ draft.categoryName || '请选择' }} ›</text
          >
        </view>
        <view class="cell tap" @tap="editNumber('price', '基础价格（元）')">
          <text class="ge__label">基础价格</text>
          <text class="ge__value ge__value--price">¥{{ priceText }}</text>
        </view>
        <view class="cell tap" @tap="editNumber('stock', '库存')">
          <text class="ge__label">库存</text>
          <text class="ge__value">{{ draft.stock }}</text>
        </view>
        <!-- 102 · 售卖时段；改时段不触发重新审核 -->
        <view class="cell tap" @tap="push(`/pages/merchant/sale-time/index?id=${goodsId}`)">
          <text class="ge__label">售卖时段</text>
          <text class="ge__value">{{ saleText }} ›</text>
        </view>
      </view>

      <!-- 规格设置 -->
      <view class="card ge__specs">
        <view class="row--between">
          <text class="t-section">规格设置</text>
          <text class="ge__add-group tap" @tap="push(`/pages/merchant/spec-edit/index?id=${goodsId}`)"
            >＋ 添加规格组</text
          >
        </view>

        <view v-for="group in draft.specGroups" :key="group.id" class="ge__group">
          <text class="ge__group-title"
            >{{ group.name }}（{{ group.required ? '必选' : '可多选' }}）</text
          >
          <view class="ge__options">
            <text v-for="o in group.options" :key="o.id" class="ge__option">{{
              optionLabel(group, o)
            }}</text>
            <text
              class="ge__option-add tap"
              @tap="push(`/pages/merchant/spec-edit/index?id=${goodsId}`)"
              >＋</text
            >
          </view>
        </view>

        <view
          v-if="!draft.specGroups.length"
          class="ge__option-add ge__option-add--block tap"
          @tap="push(`/pages/merchant/spec-edit/index?id=${goodsId}`)"
          >＋ 添加规格组</view
        >
      </view>

      <!-- 上架 -->
      <view class="card ge__sale">
        <view class="col ge__sale-text">
          <text class="cell__label">上架销售</text>
          <text v-if="!canToggleSale" class="ge__sale-hint">审核通过后才能上架</text>
        </view>
        <wf-toggle
          :on="draft.onSale && canToggleSale"
          :disabled="!canToggleSale"
          @change="onToggleSale"
        />
      </view>

      <view class="ge__foot" />
    </scroll-view>

    <view class="ge__bar">
      <view class="btn btn--primary tap" @tap="onSave">{{ saveText }}</view>
    </view>

    <wf-picker-sheet
      :show="catSheet"
      title="所属分类"
      :options="categoryOptions"
      :value="draft.categoryId"
      footer-text="去分类管理 ›"
      @close="catSheet = false"
      @pick="onPickCategory"
      @footer="
        catSheet = false;
        push('/pages/merchant/categories/index');
      "
    />
  </view>
</template>

<style lang="scss" scoped>
.ge {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ge__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 24rpx;
}

/* 审核状态条 */
.ge__audit {
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.ge__audit--reviewing {
  background: var(--c-warn-bg);
  border: 1px solid #f5e3bc;
}

.ge__audit--rejected {
  background: #fdecec;
  border: 1px solid #f6cfcf;
}

.ge__audit-title {
  font-size: 27rpx;
  font-weight: 800;
}

.ge__audit--reviewing .ge__audit-title {
  color: var(--c-warn-text-2);
}

.ge__audit--rejected .ge__audit-title {
  color: var(--c-danger);
}

.ge__audit-text {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--c-text-weak);
}

.ge__audit-link {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-danger);
}

/* 图片 */
.ge__images {
  flex-direction: row;
  gap: 20rpx;
  padding: 28rpx;
}

.ge__img {
  width: 144rpx;
  height: 144rpx;
  border-radius: 24rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.ge__img-add {
  width: 144rpx;
  height: 144rpx;
  border-radius: 24rpx;
  border: 3rpx dashed var(--c-line-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  color: var(--c-text-placeholder);
  flex-shrink: 0;
}

.ge__img-plus {
  font-size: 40rpx;
  line-height: 1;
  color: var(--c-text-placeholder);
}

.ge__img-hint {
  font-size: 20rpx;
  color: var(--c-text-placeholder);
}

/* 基础信息 */
.ge__label {
  font-size: 26rpx;
  color: var(--c-text-weak);
}

.ge__value {
  font-size: 27rpx;
  font-weight: 700;
}

.ge__value--price {
  font-weight: 800;
  color: var(--c-primary-deep);
}

.ge__value--empty {
  color: var(--c-text-placeholder);
  font-weight: 600;
}

/* 规格 */
.ge__specs {
  border: 3rpx solid var(--c-primary-line);
}

.ge__add-group {
  font-size: 22rpx;
  color: var(--c-primary);
  font-weight: 700;
}

.ge__group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.ge__group-title {
  font-size: 23rpx;
  color: var(--c-text-weak);
  font-weight: 700;
}

.ge__options {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.ge__option {
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 24rpx;
  font-weight: 700;
  padding: 12rpx 26rpx;
  border-radius: 20rpx;
}

.ge__option-add {
  border: 3rpx dashed var(--c-line-5);
  color: var(--c-text-placeholder);
  font-size: 24rpx;
  padding: 12rpx 26rpx;
  border-radius: 20rpx;
}

.ge__option-add--block {
  text-align: center;
  font-weight: 700;
}

/* 上架 */
.ge__sale {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}

.ge__sale-text {
  gap: 6rpx;
}

.ge__sale-hint {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.ge__foot {
  height: 32rpx;
}

.ge__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f3eee8;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
