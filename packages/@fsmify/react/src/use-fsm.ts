import { createFSM, FSM, FSMConfig } from 'fsmify';
import { useEffect, useMemo, useState } from 'react';

export type ReactFSM<State extends string, Event extends string> = Omit<
  FSM<State, Event>,
  'destroy' | 'getCurrentState'
> &
  Readonly<{ currentState: State; $fsm: FSM<State, Event> }>;

export const useFSM = <State extends string, Event extends string>(
  config: FSMConfig<State, Event>,
): ReactFSM<State, Event> => {
  const $fsm = useMemo(() => createFSM(config), [config]);
  const [currentState, setCurrentState] = useState($fsm.getCurrentState());

  $fsm.onAfterAllTransition(({ toState }) => {
    setCurrentState(toState);
  });

  useEffect(() => {
    () => $fsm.destroy();
  }, [$fsm]);

  return {
    ...$fsm,
    currentState,
    $fsm,
  };
};
