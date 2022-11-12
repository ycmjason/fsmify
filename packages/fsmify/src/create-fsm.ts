import { createEventBus, Listener, On } from './event-bus';
import { NoInfer } from './types/NoInfer';
import { destroyObject } from './utils/destroyObject';
import { onceAtATime } from './utils/onceAtATime';

const filterEvents = <Payload extends readonly unknown[]>(
  on: On<Payload>,
  predicate: (...payload: Payload) => boolean,
  listener: Listener<Payload>,
): ReturnType<On<Payload>> =>
  on(async (...payload) => {
    if (!predicate(...payload)) return;
    await listener(...payload);
  });

export type FSMConfig<State extends string, Event extends string> = {
  initialState: NoInfer<State>;
  states: Readonly<{
    [S in State]: Readonly<{
      [E in Event]?: NoInfer<State>;
    }>;
  }>;
  globalEvents?: Readonly<{
    [E in Event]?: NoInfer<State>;
  }>;
};

export type FSMTransitionPayload<State extends string, Event extends string> = Readonly<{
  toState: State;
  fromState: State;
  event: Event;
}>;

export type FSMTransitionListener<State extends string, Event extends string> = Listener<
  [FSMTransitionPayload<State, Event>]
>;

export type FSM<State extends string = string, Event extends string = string> = {
  readonly send: (_event: Event) => Promise<void>;
  readonly getCurrentState: () => State;
  readonly onBeforeAllTransition: (listener: FSMTransitionListener<State, Event>) => void;
  readonly onAfterAllTransition: (listener: FSMTransitionListener<State, Event>) => void;
  readonly onBeforeTransition: (
    event: Event,
    listener: FSMTransitionListener<State, Event>,
  ) => () => void;
  readonly onAfterTransition: (
    event: Event,
    listener: FSMTransitionListener<State, Event>,
  ) => () => void;
  readonly onBeforeEnterState: (
    state: State,
    listener: FSMTransitionListener<State, Event>,
  ) => () => void;
  readonly onAfterEnterState: (
    state: State,
    listener: FSMTransitionListener<State, Event>,
  ) => () => void;
  readonly onBeforeLeaveState: (
    state: State,
    listener: FSMTransitionListener<State, Event>,
  ) => () => void;
  readonly onAfterLeaveState: (
    state: State,
    listener: FSMTransitionListener<State, Event>,
  ) => () => void;
  readonly destroy: () => void;
};

export const createFSM = <State extends string, Event extends string>({
  initialState,
  states,
  globalEvents,
}: FSMConfig<State, Event>): FSM<State, Event> => {
  let currentState: State = initialState;
  const transitionBuses = {
    before: createEventBus<[FSMTransitionPayload<State, Event>]>(),
    after: createEventBus<[FSMTransitionPayload<State, Event>]>(),
  };

  const fsm: FSM<State, Event> = {
    send: onceAtATime(async (event: Event) => {
      const nextState_ = states[currentState]?.[event] ?? globalEvents?.[event];
      if (typeof nextState_ === 'undefined') return;
      const nextState = nextState_ as State; // this is related to a ts bug: https://github.com/microsoft/TypeScript/issues/50920

      const transitionEventPayload: FSMTransitionPayload<State, Event> = {
        toState: nextState,
        fromState: currentState,
        event,
      };
      await transitionBuses.before.emit(transitionEventPayload);
      currentState = nextState;
      await transitionBuses.after.emit(transitionEventPayload);
    }),
    getCurrentState: () => currentState,
    onBeforeAllTransition: transitionBuses.before.on,
    onAfterAllTransition: transitionBuses.after.on,
    onBeforeTransition: (event: Event, listener: Listener<[FSMTransitionPayload<State, Event>]>) =>
      filterEvents(transitionBuses.before.on, payload => payload.event === event, listener),
    onAfterTransition: (event: Event, listener: Listener<[FSMTransitionPayload<State, Event>]>) =>
      filterEvents(transitionBuses.after.on, payload => payload.event === event, listener),
    onBeforeEnterState: (state: State, listener: Listener<[FSMTransitionPayload<State, Event>]>) =>
      filterEvents(transitionBuses.before.on, payload => payload.toState === state, listener),
    onAfterEnterState: (state: State, listener: Listener<[FSMTransitionPayload<State, Event>]>) =>
      filterEvents(transitionBuses.after.on, payload => payload.toState === state, listener),
    onBeforeLeaveState: (state: State, listener: Listener<[FSMTransitionPayload<State, Event>]>) =>
      filterEvents(transitionBuses.before.on, payload => payload.fromState === state, listener),
    onAfterLeaveState: (state: State, listener: Listener<[FSMTransitionPayload<State, Event>]>) =>
      filterEvents(transitionBuses.after.on, payload => payload.fromState === state, listener),
    destroy: () => {
      transitionBuses.before.destroy();
      transitionBuses.after.destroy();
      destroyObject(transitionBuses);
      destroyObject(fsm);
    },
  };
  return fsm;
};
