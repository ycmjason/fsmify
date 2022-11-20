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
  const $fsm = useMemo(() => createFSM(config), []);
  const [currentState, setCurrentState] = useState($fsm.getCurrentState());

  useEffect(() => {
    $fsm.onAfterAllTransition(({ toState }) => {
      setCurrentState(toState);
    });
  }, []);

  useEffect(() => {
    return () => $fsm.destroy();
  }, []);

  return {
    ...$fsm,
    currentState,
    $fsm,
  };
};
