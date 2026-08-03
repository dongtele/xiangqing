<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getGoodsDraft, saveGoodsDraft } from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { back, push, toast } from '@/utils/nav';
import type { GoodsDraft } from '@/models';

/** 11 · 编辑商品：基础信息、图片、价格、规格 */
const draft = ref<GoodsDraft | null>(null);
let goodsId = '';

const priceText = computed(() => (draft.value ? fen2yuan2(draft.value.price) : '0.00'));

onLoad((o) => {
  goodsId = (o && o.id) || '';
});

// 从 36 规格页返回后要拿到最新规格，所以每次 show 都重新取
onShow(async () => {
  const res = await getGoodsDraft(goodsId);
  if (!res) {
    toast('商品不存在');
    back();
    return;
  }
  draft.value = res;
});

function editText(field: 'name' | 'categoryName', title: string): void {
  if (!draft.value) return;
  const current = draft.value[field];
  uni.showModal({
    title,
    editable: true,
    placeholderText: current,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm || !draft.value) return;
      const next = (res.content || '').trim();
      if (next) draft.value[field] = next;
    },
  });
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
  await saveGoodsDraft(JSON.parse(JSON.stringify(draft.value)) as GoodsDraft);
  toast(draft.value.onSale ? '已保存并上架' : '已保存（未上架）', 'success');
  back();
}
</script>

<template>
  <view v-if="draft" class="ge">
    <wf-nav-bar title="编辑商品" />

    <scroll-view class="ge__body" scroll-y>
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
          <text class="ge__value">{{ draft.name }}</text>
        </view>
        <view class="cell tap" @tap="editText('categoryName', '所属分类')">
          <text class="ge__label">所属分类</text>
          <text class="ge__value">{{ draft.categoryName }} ›</text>
        </view>
        <view class="cell tap" @tap="editNumber('price', '基础价格（元）')">
          <text class="ge__label">基础价格</text>
          <text class="ge__value ge__value--price">¥{{ priceText }}</text>
        </view>
        <view class="cell tap" @tap="editNumber('stock', '库存')">
          <text class="ge__label">库存</text>
          <text class="ge__value">{{ draft.stock }}</text>
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
            <text v-for="o in group.options" :key="o.id" class="ge__option"
              >{{ o.name }}{{ o.priceDelta > 0 ? ` ¥${(draft.price + o.priceDelta) / 100}` : '' }}</text
            >
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
        <text class="cell__label">上架销售</text>
        <wf-toggle :on="draft.onSale" @change="draft.onSale = $event" />
      </view>

      <view class="ge__foot" />
    </scroll-view>

    <view class="ge__bar">
      <view class="btn btn--primary tap" @tap="onSave">{{
        draft.onSale ? '保存并上架' : '保存'
      }}</view>
    </view>
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
