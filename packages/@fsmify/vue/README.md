# @fsmify/vue

A vue composable function for interacting with fsmify's FSM.

## Install

This package has a peer dependency on [`fsmify`](https://github.com/ycmjason/fsmify/tree/main/packages/fsmify). So you would need to install both.

```
npm install fsmify @fsmify/vue
// or
yarn add fsmify @fsmify/vue
```

## Example

See this example on [stackblitz](https://stackblitz.com/edit/vitejs-vite-pkevt2?file=src/App.vue).

```vue
<template>
  <div v-if="uiState === 'init'">
    <button @click="loadData">Click me to load</button>
  </div>
  <div v-else-if="uiState === 'loading'">Loading...</div>
  <div v-else-if="uiState === 'loaded'">Hello world!</div>
</template>

<script lang="ts">
import { computed, onBeforeMount, reactive, defineComponent } from 'vue';
import { useFSM } from '@fsmify/vue';

const loadData = async () => {
  await new Promise(res => setTimeout(res, 2500));
};

export default defineComponent({
  setup() {
    const fsm = useFSM({
      initialState: 'init',
      states: {
        init: { LOAD: 'loading' },
        loading: { LOAD_FINISH: 'loaded' },
        loaded: {},
      },
    });

    return {
      uiState: computed(() => fsm.currentState.value),
      loadData: async () => {
        fsm.send('LOAD');
        await loadData();
        fsm.send('LOAD_FINISH');
      },
    };
  },
});
</script>
```

## API

### `useFSM(config: FSMConfig): VueFSM`

This method creates a `VueFSM` that automatically destroy when the component unmounts. This method assumes execution to happen within [`setup()`](https://vuejs.org/api/composition-api-setup.html).

See also: [FSMConfig](https://github.com/ycmjason/fsmify/tree/main/packages/fsmify#fsmconfig-type).

### `VueFSM` (type)

`VueFSM<State extends string, Event extends string>` has most of the properties from [FSM](https://github.com/ycmjason/fsmify/tree/main/packages/fsmify#fsm-type) with a few tweaks:

- `currentState: Readonly<Ref<State>>`
  - A reactive [ref](https://vuejs.org/api/reactivity-core.html#ref) that reflects the current state of the FSM.
- `$fsm`
  - The internal `FSM`. You should rarely need this.
- <del>`getCurrentState()`</del>
  - Thanks to vue's reactivity, we can easily track values with a [`Ref`](https://vuejs.org/api/reactivity-core.html#ref). To access the current state, please use `currentState` (see above).
- <del>`destroy()`</del>
  - `destroy()` is removed because `VueFSM` is automatically destroyed as the component [unmounts](https://vuejs.org/guide/essentials/lifecycle.html).

## Author

Jason Yu (@ycmjason)
