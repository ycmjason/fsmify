import { shallowMount } from '@vue/test-utils';
import { defineComponent } from 'vue';

export const mountComposable = <T>(fn: () => T): [t: T, unmount: () => void] => {
  const wrapper = shallowMount(
    defineComponent({
      setup() {
        return { t: fn() };
      },
      render: () => null,
    }),
  );

  return [wrapper.vm.t as T, () => wrapper.unmount()];
};
