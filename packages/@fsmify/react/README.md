# @fsmify/react

A react hook for interacting with fsmify's FSM.

## Install

This package has a peer dependency on [`fsmify`](https://github.com/ycmjason/fsmify/tree/main/packages/fsmify). So you would need to install both.

```
npm install fsmify @fsmify/react
// or
yarn add fsmify @fsmify/react
```

## Example

You can see the following example live at [codesandbox](https://codesandbox.io/s/fsmify-react-demo-3x4qkj?file=/src/App.tsx).

```tsx
import { useFSM } from '@fsmify/react';
import { useEffect } from 'react';

export default () => {
  const fsm = useFSM({
    initialState: 'init',
    states: {
      init: { LOAD: 'loading' },
      loading: { LOAD_FINISH: 'loaded' },
      loaded: {},
    },
  });

  const load = async () => {
    fsm.send('LOAD');
    await loadData();
    fsm.send('LOAD_FINISH');
  };

  useEffect(() => {
    fsm.onBeforeEnterState('loading', () => {
      console.log('loading...');
    });
  });

  return (
    <>
      <h2>@fsmify/react demo</h2>
      {{
        init: () => <button onClick={load}>Click me to load</button>,
        loading: () => <div>Loading...</div>,
        loaded: () => <div>Hello world!</div>,
      }[fsm.currentState]()}
    </>
  );
};
```

## API

### `useFSM(config: FSMConfig): ReactFSM`

This method creates a `ReactFSM` that automatically destroy before the component unmounts. This method assumes execution to happen within a component.

See also: [FSMConfig](https://github.com/ycmjason/fsmify/tree/main/packages/fsmify#fsmconfig-type).

### `ReactFSM` (type)

`ReactFSM<State extends string, Event extends string>` has most of the properties from [FSM](https://github.com/ycmjason/fsmify/tree/main/packages/fsmify#fsm-type) with a few tweaks:

- `currentState: State`
  - the current state of `fsm`.
- `$fsm`
  - The internal `FSM`. You should rarely need this.
- <del>`getCurrentState()`</del>
  - This is removed in favor of `currentState` (see above).
- <del>`destroy()`</del>
  - `destroy()` is removed because `ReactFSM` is automatically destroyed as the component [unmounts](https://vuejs.org/guide/essentials/lifecycle.html).

## Author

Jason Yu (@ycmjason)
