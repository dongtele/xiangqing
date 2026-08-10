<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getGoodsAuditDetail, submitGoodsAudit } from '@/services/api';
import { back, push, toast } from '@/utils/nav';
import type { AuditIssue, GoodsAuditDetail } from '@/models';

/**
 * 101 · 商品审核驳回。
 * 逐项列出问题并直达对应字段，已通过项保留不重填；重新提交后回到审核中。
 */
const detail = ref<GoodsAuditDetail | null>(null);
let goodsId = '';

/** 连续 3 次驳回进人工复核（交付文档） */
const needsManual = computed(() => (detail.value?.rejectCount || 0) >= 3);

onLoad((o) => {
  goodsId = (o && o.id) || '';
});

onShow(async () => {
  const res = await getGoodsAuditDetail(goodsId);
  if (!res) {
    toast('审核记录不存在');
    back();
    return;
  }
  detail.value = res;
});

const FIELD_LABEL: Record<string, string> = {
  images: '图片',
  price: '价格',
  name: '名称',
  spec: '规格',
  desc: '描述',
};

function fieldLabel(field: string): string {
  return FIELD_LABEL[field] || '资料';
}

/** 「去修改」直达 99 对应字段；99 收到 focus 参数后可滚到该处 */
function onFix(issue: AuditIssue): void {
  push(`/pages/merchant/goods-publish/index?id=${goodsId}&focus=${issue.field}`);
}

async function onResubmit(): Promise<void> {
  const res = await submitGoodsAudit(goodsId);
  if (!res.ok) {
    toast(res.message || '提交失败');
    return;
  }
  toast('已重新提交', 'success');
  uni.redirectTo({ url: '/pages/merchant/goods-audit/index' });
}
</script>

<template>
  <view v-if="detail" class="gr">
    <wf-nav-bar title="审核结果" />

    <scroll-view class="gr__body" scroll-y>
      <view class="card gr__hero">
        <text class="gr__title">「{{ detail.name }}」审核未通过</text>
        <text class="gr__sub">{{ detail.rejectedAtText }} · 修改后可立即重新提交</text>
      </view>

      <!-- 需修改项：逐项直达 -->
      <view class="card">
        <text class="t-section">需修改项（{{ detail.issues.length }}）</text>

        <view v-for="(issue, i) in detail.issues" :key="i" class="gr__issue">
          <text class="gr__issue-field">{{ fieldLabel(issue.field) }}</text>
          <view class="flex1 col gr__issue-text">
            <text class="gr__issue-title">{{ issue.title }}</text>
            <text class="gr__issue-desc">{{ issue.desc }}</text>
          </view>
          <text class="gr__issue-fix tap" @tap="onFix(issue)">去修改 ›</text>
        </view>
      </view>

      <!-- 已通过项：不用重填 -->
      <view v-if="detail.passedFields.length" class="card">
        <text class="t-section">已通过项 · 无需重填</text>
        <view class="gr__passed">
          <text v-for="f in detail.passedFields" :key="f" class="gr__passed-item">✓ {{ f }}</text>
        </view>
      </view>

      <text class="gr__note">{{
        needsManual
          ? '该商品已连续 3 次驳回，将进入人工复核，建议先联系客服说明情况。'
          : '同一商品连续 3 次驳回将进入人工复核，可先联系客服说明情况。'
      }}</text>

      <view class="gr__foot" />
    </scroll-view>

    <view class="gr__bar">
      <view class="gr__btn gr__btn--ghost tap" @tap="push('/pages/merchant/help/index')"
        >联系客服</view
      >
      <view class="gr__btn gr__btn--primary tap" @tap="onResubmit">修改并重新提交</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.gr {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gr__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 24rpx;
}

.gr__hero {
  background: #fdecec;
  border: 1px solid #f6cfcf;
  gap: 10rpx;
}

.gr__title {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--c-danger);
}

.gr__sub {
  font-size: 22rpx;
  color: var(--c-text-weak);
}

.gr__issue {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: #faf7f2;
  border-radius: 24rpx;
  padding: 24rpx;
}

.gr__issue-field {
  font-size: 21rpx;
  font-weight: 800;
  color: var(--c-danger);
  background: #fdecec;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.gr__issue-text {
  gap: 8rpx;
  min-width: 0;
}

.gr__issue-title {
  font-size: 26rpx;
  font-weight: 700;
}

.gr__issue-desc {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.gr__issue-fix {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary);
  flex-shrink: 0;
}

.gr__passed {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.gr__passed-item {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-success-text, #00915f);
  background: var(--c-success-bg);
  padding: 12rpx 22rpx;
  border-radius: 16rpx;
}

.gr__note {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.gr__foot {
  height: 32rpx;
}

.gr__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f3eee8;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 24rpx;
}

.gr__btn {
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 29rpx;
  font-weight: 800;
}

.gr__btn--ghost {
  flex: 1;
  border: 1px solid var(--c-border-btn);
  color: var(--c-text-2);
  background: #fff;
}

.gr__btn--primary {
  flex: 1.6;
  background: var(--grad-main);
  color: #fff;
  box-shadow: var(--sh-primary-btn);
}
</style>
