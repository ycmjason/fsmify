import { onUnmounted, ref, Ref } from 'vue-demi';
import { createFSM, FSM, FSMConfig } from 'fsmify';

export type VueFSM<State extends string, Event extends string> = Omit<
  FSM<State, Event>,
  'destroy' | 'getCurrentState'
> & { currentState: Readonly<Ref<State>>; $fsm: FSM<State, Event> };

export const useFSM = <State extends string, Event extends string>(
  config: FSMConfig<State, Event>,
): VueFSM<State, Event> => {
  const $fsm = createFSM(config);
  const currentState = ref($fsm.getCurrentState()) as Ref<State>; // see https://github.com/vuejs/core/issues/6766

  $fsm.onAfterAllTransition(({ toState }) => {
    currentState.value = toState;
  });

  onUnmounted(() => $fsm.destroy());

  return {
    ...$fsm,
    currentState,
    $fsm,
  };
};
