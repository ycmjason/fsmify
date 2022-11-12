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
      walk: 'walking',
      jump: 'jumping',
    },
    walking: {},
    jumping: { stop: 'jumping', stopNow: 'idle' },
  },
  globalEvents: {
    stop: 'idle',
  },
});

fsm.getCurrentState(); // idle
fsm.send('walk');
fsm.getCurrentState(); // walking
fsm.send('stop');
fsm.getCurrentState(); // idle
fsm.send('jump');
fsm.getCurrentState(); // jumping
fsm.send('stop'); // transition defined in `jumping` state take precedence
fsm.getCurrentState(); // jumping

fsm.onBeforeEnterState('idle', ({ fromState, toState, event }) => {
  console.log('idle now');
});

fsm.send('stopNow'); // console: idle now
```

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
  - Signal the FSM a transition given the event name. If the event is not defined for the current `State` or `globalEvents`, nothing happens. The returned promise resolves after all the `onBefore...` and `onAfter...` listeners finish.
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

## Author

Jason Yu (@ycmjason)
