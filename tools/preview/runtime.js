/**
 * 迷你的小程序运行时替身：让页面 / 组件的真实 TS 逻辑能在 Node 里跑一遍，
 * 从而用「真实数据 + 真实 WXML/WXSS」产出静态预览。仅用于本地预览。
 */
'use strict';

const path = require('path');

function clone(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

class Runtime {
  constructor(buildDir) {
    this.buildDir = buildDir;
    this.storage = {};
    this.navigations = [];
    this.toasts = [];
    this.pending = null;
    this.appOptions = null;
    this.app = null;
    this.install();
  }

  install() {
    const self = this;

    global.Page = (opts) => {
      self.pending = opts;
      return opts;
    };
    global.Component = (opts) => {
      self.pending = opts;
      return opts;
    };
    global.App = (opts) => {
      self.appOptions = opts;
      return opts;
    };
    global.getApp = () => self.app;
    global.getCurrentPages = () => [{}, {}];

    global.wx = {
      getWindowInfo: () => ({ statusBarHeight: 44, windowWidth: 375, windowHeight: 812 }),
      getMenuButtonBoundingClientRect: () => ({
        top: 48,
        height: 32,
        left: 281,
        right: 368,
        width: 87,
        bottom: 80,
      }),
      getStorageSync: (k) => (k in self.storage ? clone(self.storage[k]) : ''),
      setStorageSync: (k, v) => {
        self.storage[k] = clone(v);
      },
      removeStorageSync: (k) => {
        delete self.storage[k];
      },
      showToast: (o) => self.toasts.push(o.title),
      hideToast: () => {},
      showLoading: () => {},
      hideLoading: () => {},
      showModal: (o) => o && o.success && o.success({ confirm: false, cancel: true }),
      reLaunch: (o) => self.navigations.push(['reLaunch', o.url]),
      navigateTo: (o) => self.navigations.push(['navigateTo', o.url]),
      redirectTo: (o) => self.navigations.push(['redirectTo', o.url]),
      navigateBack: () => self.navigations.push(['navigateBack', '']),
      switchTab: (o) => self.navigations.push(['switchTab', o.url]),
      setClipboardData: () => {},
      makePhoneCall: () => {},
      vibrateShort: () => {},
      createSelectorQuery: () => self.selectorQueryStub(),
      request: () => {},
      nextTick: (fn) => setTimeout(fn, 0),
    };
  }

  selectorQueryStub() {
    const q = {
      in: () => q,
      select: () => q,
      selectAll: () => q,
      boundingClientRect: () => q,
      exec: (cb) => cb && cb([[], null]),
    };
    return q;
  }

  /** 清空构建产物的 require 缓存，让每个场景从干净状态开始 */
  reset() {
    Object.keys(require.cache).forEach((key) => {
      if (key.startsWith(this.buildDir)) delete require.cache[key];
    });
    this.storage = {};
    this.navigations = [];
    this.toasts = [];
    this.app = null;
    this.appOptions = null;
  }

  require(relative) {
    return require(path.join(this.buildDir, relative));
  }

  /** 启动 app.ts（onLaunch 会读取 globalData / 登录态） */
  bootApp() {
    this.pending = null;
    this.require('app.js');
    const opts = this.appOptions || { globalData: {} };
    const app = {};
    Object.keys(opts).forEach((k) => {
      app[k] = typeof opts[k] === 'function' ? opts[k] : clone(opts[k]);
    });
    this.app = app;
    if (typeof app.onLaunch === 'function') app.onLaunch.call(app);
    return app;
  }

  /** 载入页面模块，返回其注册的 options */
  loadPage(relative) {
    this.pending = null;
    this.require(relative);
    if (!this.pending) throw new Error(`未捕获到 Page 注册：${relative}`);
    return this.pending;
  }

  loadComponent(relative) {
    this.pending = null;
    this.require(relative);
    if (!this.pending) throw new Error(`未捕获到 Component 注册：${relative}`);
    return this.pending;
  }

  /** 用 options 造一个可运行实例（setData 直接落到 data） */
  createInstance(opts, isComponent) {
    const inst = {
      data: clone(opts.data) || {},
      properties: {},
      setData(patch, cb) {
        Object.assign(inst.data, clone(patch));
        if (typeof cb === 'function') cb();
      },
      triggerEvent() {},
      selectComponent: () => null,
      createSelectorQuery: () => global.wx.createSelectorQuery(),
      hasBehavior: () => false,
    };

    const skip = new Set([
      'data',
      'properties',
      'observers',
      'methods',
      'lifetimes',
      'options',
      'behaviors',
      'externalClasses',
    ]);
    Object.keys(opts).forEach((k) => {
      if (skip.has(k)) return;
      inst[k] = typeof opts[k] === 'function' ? opts[k] : clone(opts[k]);
    });
    if (isComponent && opts.methods) {
      Object.keys(opts.methods).forEach((k) => {
        inst[k] = opts.methods[k];
      });
    }
    return inst;
  }
}

module.exports = { Runtime, clone };
