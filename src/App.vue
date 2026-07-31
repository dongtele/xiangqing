<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { initChrome } from '@/utils/chrome';

onLaunch(() => {
  // 顶部系统区域度量只测一次，全局共用（自定义导航栏与沉浸式头部都靠它做占位）
  initChrome();
});
</script>

<template>
  <!-- uni-app 的根组件不渲染内容，页面由路由挂载 -->
</template>

<style lang="scss">
@use '@/styles/common.scss';
</style>
