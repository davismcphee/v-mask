import { createLocalVue, mount } from '@vue/test-utils';
import VueMask, { VueMaskDirective, VueMaskPlugin } from '../index';
import { timeRangeMask } from '../utils/timeRangeMask';

describe('plugin/directive registration', () => {
  let Vue;

  beforeEach(() => {
    Vue = createLocalVue();
  });

  it('default export should be a function', () => {
    expect(VueMask).toEqual(expect.any(Function));
  });

  it('named export `VueMaskPlugin` should be a function', () => {
    expect(VueMaskPlugin).toEqual(expect.any(Function));
  });

  it('named export `VueMaskDirective` should be an object', () => {
    expect(VueMaskDirective).toEqual(expect.any(Object));
  });

  it('should register `v-mask` directive', () => {
    expect(Vue.options.directives.mask).toBeUndefined();
    Vue.use(VueMask);
    expect(Vue.options.directives.mask).toEqual(expect.any(Object));
  });

  it('should allow to use exposed directive with custom name', () => {
    expect(Vue.options.directives.fakeMask).toBeUndefined();
    Vue.directive('fakeMask', VueMaskDirective);
    expect(Vue.options.directives.fakeMask).toEqual(expect.any(Object));
  });
});

describe('directive usage', () => {
  let mountWithMask;

  beforeEach(() => {
    const localVue = createLocalVue();
    localVue.use(VueMask);
    mountWithMask = (arg, options) => mount(arg, { ...options, localVue });
  });

  it('should run this canary test', () => {
    const wrapper = mountWithMask({
      template: '<input />',
    });
    expect(wrapper.is('input')).toBe(true);
  });

  it('should update model value after directive bind', () => {
    const wrapper = mountWithMask({
      data: () => ({ mask: '##.##.####', value: '11112011' }),
      template: '<input v-mask="mask" v-model="value"/>',
    });
    expect(wrapper.vm.$el.value).toBe('11.11.2011');
  });

  it('should update model value when input value changes', async () => {
    const wrapper = mountWithMask({
      data: () => ({ mask: '##.##.####', value: undefined }),
      template: '<input v-mask="mask" v-model="value"/>',
    });
    wrapper.vm.$el.value = '11112011';
    wrapper.trigger('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$el.value).toBe('11.11.2011');
  });

  it('should accept an array of regular expressions directly', async () => {
    const wrapper = mountWithMask({
      data: () => ({ mask: ['(', /\d/, /\d/, /\d/, ') ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/], value: '5555551234' }),
      template: '<input v-mask="mask" v-model="value"/>',
    });
    expect(wrapper.vm.$el.value).toBe('(555) 555-1234');
  });

  it('should allow for add/removal of global mask placeholders', async () => {
    const localVue = createLocalVue();
    localVue.use(VueMask, {
      placeholders: {
        '#': null,
        D: /\d/,
      },
    });
    const wrapper = mount({
      data: () => ({ mask: '###-DDD-###-DDD', value: '123456' }),
      template: '<input v-mask="mask" v-model="value"/>',
    }, { localVue });
    expect(wrapper.vm.$el.value).toBe('###-123-###-456');
  });

  it('should allow placeholders for uppercase and lowercase characters', async () => {
    const localVue = createLocalVue();
    localVue.use(VueMask, {
      placeholders: {
        u: /[A-Z]/,
        l: /[a-z]/,
      },
    });
    const wrapper = mount({
      data: () => ({ mask: '###-###-###-ul-ul', value: '123123123AbAb' }),
      template: '<input v-mask="mask" v-model="value"/>',
    }, { localVue });
    expect(wrapper.vm.$el.value).toBe('123-123-123-Ab-Ab');
  });

  it('should allow placeholders for cyrillic characters', async () => {
    const localVue = createLocalVue();
    localVue.use(VueMask, {
      placeholders: {
        Я: /[\wа-яА-Я]/,
      },
    });
    const wrapper = mount({
      data: () => ({ mask: 'ЯЯЯЯЯЯ ЯЯЯЯ', value: 'Доброеутро' }),
      template: '<input v-mask="mask" v-model="value"/>',
    }, { localVue });
    expect(wrapper.vm.$el.value).toBe('Доброе утро');
  });

  it('should be possible to create a mask for accepting a valid time range', async () => {
    const wrapper = mountWithMask({
      data: () => ({
        mask: timeRangeMask,
        value: '02532137',
      }),
      template: '<input v-mask="mask" v-model="value"/>',
    });
    expect(wrapper.vm.$el.value).toBe('02:53-21:37');
  });

  it('should be possible to create a mask for rejecting an invalid time range', async () => {
    const wrapper = mountWithMask({
      data: () => ({
        mask: timeRangeMask,
        value: '23599999',
      }),
      template: '<input v-mask="mask" v-model="value"/>',
    });
    expect(wrapper.vm.$el.value).toBe('23:59-');
  });

  it('should have the ability to give two or multiple choices', async () => {
    const localVue = createLocalVue();
    localVue.use(VueMask, {
      placeholders: {
        P: /(6|7)/,
      },
    });
    const wrapper = mount({
      data: () => ({ mask: '0P-##-##-##-##', value: '0755555555' }),
      template: '<input v-mask="mask" v-model="value"/>',
    }, { localVue });
    expect(wrapper.vm.$el.value).toBe('07-55-55-55-55');
  });
});
