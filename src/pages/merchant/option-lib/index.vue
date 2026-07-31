<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getOptionLib, toggleLibOption } from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { toast } from '@/utils/nav';
import type { OptionLibGroup } from '@/models';

/** 64 · 规格与加料选项库：可复用选项库维护 */
const groups = ref<OptionLibGroup[]>([]);

onShow(async () => {
  groups.value = await getOptionLib();
});

async function onToggle(groupId: string, optionId: string): Promise<void> {
  await toggleLibOption(groupId, optionId);
  groups.value = await getOptionLib();
}

function onNewGroup(): void {
  toast('新建选项组后可在 36 规格与价格里引用');
}
</script>

<template>
  <view class="ol">
    <wf-nav-bar title="选项库" right="＋ 新建组" @righttap="onNewGroup" />

    <scroll-view class="ol__body" scroll-y>
      <view v-for="group in groups" :key="group.id" class="card">
        <view class="row--between">
          <view class="col ol__head">
            <text class="ol__name">{{ group.name }}</text>
            <text class="ol__meta">{{ group.metaText }}</text>
          </view>
          <text class="ol__edit tap" @tap="toast('编辑该组会同步影响所有引用商品')">编辑</text>
        </view>

        <!-- 多选组：带勾选与加价的明细行 -->
        <template v-if="group.multiple">
          <view v-for="o in group.options" :key="o.id" class="ol__row">
            <view class="row ol__row-left tap" @tap="onToggle(group.id, o.id)">
              <view class="ol__check" :class="{ 'ol__check--on': o.checked }">
                <wf-icon v-if="o.checked" name="check" :size="20" color="#FFFFFF" :weight="3.6" />
              </view>
              <text class="ol__opt-name">{{ o.name }}</text>
            </view>
            <text class="ol__opt-price">+￥{{ fen2yuan2(o.priceDelta) }}</text>
          </view>
        </template>

        <!-- 单选组：胶囊平铺 -->
        <view v-else class="ol__chips">
          <text v-for="o in group.options" :key="o.id" class="ol__chip"
            >{{ o.name }}
            <text v-if="o.priceDelta >= 0" class="ol__chip-delta"
              >+{{ o.priceDelta / 100 }}</text
            >
          </text>
        </view>
      </view>

      <text class="ol__tip">修改选项库会同步影响所有引用商品，顾客端下单页实时生效。</text>
      <view class="ol__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ol {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ol__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.ol__body > .card {
  margin-bottom: 20rpx;
}

.ol__head {
  gap: 4rpx;
}

.ol__name {
  font-size: 28rpx;
  font-weight: 800;
}

.ol__meta {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.ol__edit {
  font-size: 23rpx;
  color: var(--c-text-weak);
  font-weight: 700;
}

.ol__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ol__row-left {
  gap: 20rpx;
}

.ol__check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 10rpx;
  border: 3rpx solid var(--c-line-5);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ol__check--on {
  border-color: var(--c-primary);
  background: var(--c-primary);
}

.ol__opt-name {
  font-size: 26rpx;
  font-weight: 700;
}

.ol__opt-price {
  font-size: 25rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
}

.ol__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.ol__chip {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--c-text-2);
  background: var(--c-fill);
  border: 1px solid #ede6de;
  padding: 12rpx 24rpx;
  border-radius: 28rpx;
}

.ol__chip-delta {
  color: var(--c-primary-deep);
  font-weight: 800;
}

.ol__tip {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 0 8rpx;
}

.ol__foot {
  height: 32rpx;
}
</style>
