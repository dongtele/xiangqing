/** 开关：44×25（md）/ 40×23（sm），开 #00B578，关 #D9D2C9，滑块白色。 */
Component({
  options: { virtualHost: true },

  properties: {
    on: { type: Boolean, value: false },
    size: { type: String, value: 'md' },
    disabled: { type: Boolean, value: false },
  },

  methods: {
    onTap() {
      if (this.properties.disabled) return;
      this.triggerEvent('change', { on: !this.properties.on });
    },
  },
});
