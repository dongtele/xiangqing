/**
 * 占位图集中管理。
 * 设计稿使用的是外部图床示意图；接真实数据源时，这里整体替换为业务 CDN 地址
 * （商品图 1:1、店铺头图 16:9，走 CDN + WebP + 懒加载）。
 */
const U = (id: string, w: number): string => `https://images.unsplash.com/${id}?w=${w}&q=80`;

export const IMG = {
  shopLogo: U('photo-1637075223191-21697ec6d0ff', 200),
  braisedPork: U('photo-1630564510802-0cac202af38d', 400),
  braisedPorkLarge: U('photo-1630564510802-0cac202af38d', 800),
  hairtail: U('photo-1580476262798-bddd9f4b7369', 400),
  riceBowl: U('photo-1512058564366-18510be2db19', 400),
  porkChop: U('photo-1599921841143-819065a55cc6', 400),
  plumJuice: U('photo-1513558161293-cdaf765ed2fd', 400),
  friedPork: U('photo-1552914343-05ccdaf123d6', 400),
  steamedFish: U('photo-1760504526044-840cade997b2', 400),
  salad: U('photo-1692780941266-96892bb6c9df', 400),
};
