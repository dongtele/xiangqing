/**
 * 图片资源集中管理。
 *
 * 交付文档 Assets：设计稿中没有任何位图素材，商品图 / 店铺头图 / 评价图全部是
 * `#F0EAE3` 灰块占位，需业务方提供真实图源。所以这里一律给空串，
 * 组件遇到空串就渲染 `.thumb` 灰块；等拿到 CDN 地址（商品图 1:1、店铺头图 16:9，
 * WebP + 懒加载）后只改这个文件即可，页面代码不动。
 */
export const IMG = {
  shopLogo: '',
  braisedPork: '',
  hairtail: '',
  riceBowl: '',
  porkChop: '',
  plumJuice: '',
  friedPork: '',
  steamedFish: '',
  salad: '',
  avatar: '',
  pointsShip: '',
  pointsCola: '',
  pointsCash: '',
  pointsBag: '',
};
