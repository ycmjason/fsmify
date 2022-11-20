# fsmify

A simple finite state machine library with first-class typescript support.

## Install

```
npm install fsmify
// or
yarn add fsmify
```

## Examples

```ts
import { createFSM } from 'fsmify';

const fsm = createFSM({
  initialState: 'idle',
  states: {
    idle: {
      WALK: 'walking',
      JUMP: 'jumping',
    },
    walking: {},
    jumping: { STOP: undefined, STOP_NOW: 'idle' },
  },
  globalEvents: {
    STOP: 'idle',
  },
});

fsm.getCurrentState(); // idle
await fsm.send('WALK');
fsm.getCurrentState(); // walking
await fsm.send('STOP');
fsm.getCurrentState(); // idle
await fsm.send('JUMP');
fsm.getCurrentState(); // jumping
await fsm.send('STOP'); // transition defined in `jumping` state take precedence
fsm.getCurrentState(); // jumping

fsm.onBeforeEnterState('idle', async ({ fromState, toState, event }) => {
  await new Promise(res => setTimeout(res, 1000));
  console.log('idle now');
});

await fsm.send('STOP_NOW'); // promise resolves after ^ finishes; console: 'idle now'
```

## Using with UI libraries

You can use [@fsmify/vue] and [@fsmify/react] which provides a more idiomatic way of interacting with [fsmify].

## API

### `createFSM(config: FSMConfig): FSM`

Create a finite state machine.

### `FSMConfig` (type)

`FSMConfig<State extends string, Event extends string>` has the following properties:

- `initialState`
  - Type: `string`
  - The initial state of the FSM. The value must be defined in the key of the `states` object.
- `states`
  - Type: `{ [S in State]: { [E in Event]?: State } }`
  - This object defines all the states as keys. The value of each entry is an object representing the transition - `{ [E in Event]?: State }`. The transition defines here take precedence over the ones in `globalEvents`, i.e., if the same event name is defined here and `globalEvents`, the `globalEvents` transition will be ignored.
- `globalEvents` (optional)
  - Type: `{ [E in Event]?: State }`
  - This object defines a transitions that is available on all states.

### `FSM` (type)

`FSM<State extends string, Event extends string>` has the following methods:

- `getCurrentState(): State`
  - Return the current state of FSM.
- `send(event: Event): Promise<void>`
  - Signal the FSM a transition given the event name. If the event is not defined for the current `State` or `globalEvents`, nothing happens. The returned promise resolves after all the `onBefore...` and `onAfter...` listeners finish. Only 1 `send` can happen at a time. So you should never `await send` within `onBefore...` and `onAfter...` or the send will never go out. See more in the [caveat](#caveat) session.
- `onBeforeAllTransition` / `onAfterAllTransition`
  - Type: `(listener: FSMTransitionListener<State, Event>) => void`
  - Add hook to be executed before / after all transition. The transiton is considered finished when all listeners' promises resolves, during which all `send` events are queued.
- `onBeforeTransition` / `onAfterTransition`
  - Type: `(event: Event, listener: FSMTransitionListener<State, Event>) => () => void`
  - Similar to `onBeforeAllTransition` / `onAfterAllTransition`, but the `listener` is only triggered for the given `event`.
- `onBeforeEnterState` / `onAfterEnterState`
  - Type: `(state: State, listener: FSMTransitionListener<State, Event>) => () => void`
  - Similar to `onBeforeAllTransition` / `onAfterAllTransition`, but the `listener` is only triggered when entering `state`.
- `onBeforeLeaveState` / `onAfterLeaveState`
  - Type: `(state: State, listener: FSMTransitionListener<State, Event>) => () => void`
  - Similar to `onBeforeAllTransition` / `onAfterAllTransition`, but the `listener` is only triggered when leaving `state`.
- `destroy(): void`
  - Destroy the FSM. All methods will be unaccessible after this call.

### `FSMTransitionListener` (type)

`FSMTransitionListener<State, Event>` has type `(payload: FSMTransitionPayload<State, Event>) => void | Promise<void>`.

### `FSMTransitionPayload` (type)

`FSMTransitionPayload<State, Event>` has type `{ fromState: State, toState: State, event: Event }`.

## Caveat

### Never call `await fsm.send(...)` within `onBefore...` / `onAfter...`

`fsm.send(...)` resolves only after all before / after listeners finish and only 1 send is allowed at a time. Doing so will make the current `send` never finish and hence the next send never go out. If you need to `send()` something in `onBefore...` / `onAfter...`. Consider doing it without `await`, or in an `async iffe`.

```ts
// ❌
fsm.onBeforeEnterState('running', async () => {
  await fsm.send('JUMP');
});

// ✅
fsm.onBeforeEnterState('running', async () => {
  fsm.send('JUMP');
});

// ✅
fsm.onBeforeEnterState('running', async () => {
  (async () => {
    await fsm.send('JUMP');
    // do something after JUMP
  })();
});
```

## Author

Jason Yu (@ycmjason)

[fsmify]: https://github.com/ycmjason/fsmify/tree/main/packages/fsmify
[@fsmify/vue]: https://github.com/ycmjason/fsmify/tree/main/packages/%40fsmify/vue
[@fsmify/react]: https://github.com/ycmjason/fsmify/tree/main/packages/%40fsmify/react
