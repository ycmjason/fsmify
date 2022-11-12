import { createEventBus, Listener, On } from './event-bus';
import { NoInfer } from './types/NoInfer';
import { destroyObject } from './utils/destroyObject';

const filterEvents = <Payload extends readonly unknown[]>(
  on: On<Payload>,
  predicate: (...payload: Payload) => boolean,
  listener: Listener<Payload>,
): ReturnType<On<Payload>> =>
  on(async (...payload) => {
    if (!predicate(...payload)) return;
    await listener(...payload);
  });

type FSMConfig<State extends string, Event extends string> = {
  initialState: NoInfer<State>;
  states: Readonly<{
    [S in State]?: Readonly<{
      [E in Event]?: NoInfer<State>;
    }>;
  }>;
  globalEvents?: Readonly<{
    [E in Event]?: NoInfer<State>;
  }>;
};

export type FSM<State extends string = string, Event extends string = string> = {
  send: (_event: Event) => Promise<void>;
  getCurrentState: () => State;
  onBeforeAllTransition: On<[FSMTransitionEventPayload<State, Event>]>;
  onAfterAllTransition: On<[FSMTransitionEventPayload<State, Event>]>;
  onBeforeTransition: (
    event: Event,
    listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
  ) => () => void;
  onAfterTransition: (
    event: Event,
    listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
  ) => () => void;
  onBeforeEnterState: (
    state: State,
    listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
  ) => () => void;
  onAfterEnterState: (
    state: State,
    listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
  ) => () => void;
  onBeforeLeaveState: (
    state: State,
    listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
  ) => () => void;
  onAfterLeaveState: (
    state: State,
    listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
  ) => () => void;
  destroy: () => void;
};

type FSMTransitionEventPayload<State extends string, Event extends string> = Readonly<{
  toState: State;
  fromState: State;
  event: Event;
}>;

export const createFiniteStateMachine = <State extends string, Event extends string>({
  initialState,
  states,
  globalEvents,
}: FSMConfig<State, Event>): FSM<State, Event> => {
  let currentState: State = initialState;
  const transitionBuses = {
    before: createEventBus<[FSMTransitionEventPayload<State, Event>]>(),
    after: createEventBus<[FSMTransitionEventPayload<State, Event>]>(),
  };

  const fsm: FSM<State, Event> = {
    send: async (event: Event) => {
      const nextState_ = states[currentState]?.[event] ?? globalEvents?.[event];
      if (typeof nextState_ === 'undefined') return;
      const nextState = nextState_ as State; // this is related to a ts bug: https://github.com/microsoft/TypeScript/issues/50920

      const transitionEventPayload: FSMTransitionEventPayload<State, Event> = {
        toState: nextState,
        fromState: currentState,
        event,
      };
      await transitionBuses.before.emit(transitionEventPayload);
      currentState = nextState;
      await transitionBuses.after.emit(transitionEventPayload);
    },
    getCurrentState: () => currentState,
    onBeforeAllTransition: transitionBuses.before.on,
    onAfterAllTransition: transitionBuses.after.on,
    onBeforeTransition: (
      event: Event,
      listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
    ) => filterEvents(transitionBuses.before.on, payload => payload.event === event, listener),
    onAfterTransition: (
      event: Event,
      listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
    ) => filterEvents(transitionBuses.after.on, payload => payload.event === event, listener),
    onBeforeEnterState: (
      state: State,
      listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
    ) => filterEvents(transitionBuses.before.on, payload => payload.toState === state, listener),
    onAfterEnterState: (
      state: State,
      listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
    ) => filterEvents(transitionBuses.after.on, payload => payload.toState === state, listener),
    onBeforeLeaveState: (
      state: State,
      listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
    ) => filterEvents(transitionBuses.before.on, payload => payload.fromState === state, listener),
    onAfterLeaveState: (
      state: State,
      listener: Listener<[FSMTransitionEventPayload<State, Event>]>,
    ) => filterEvents(transitionBuses.after.on, payload => payload.fromState === state, listener),
    destroy: () => {
      transitionBuses.before.destroy();
      transitionBuses.after.destroy();
      destroyObject(transitionBuses);
      destroyObject(fsm);
    },
  };
  return fsm;
};
