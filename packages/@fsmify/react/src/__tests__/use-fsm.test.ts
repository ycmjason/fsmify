import { expect, it } from 'vitest';
import { useFSM } from '../use-fsm';
import { renderHook } from '@testing-library/react';

it('should set currentState to initial state', () => {
  const { result: fsmRef } = renderHook(() =>
    useFSM({
      initialState: 'closed',
      states: {
        closed: { OPEN: 'opened' },
        opened: {},
      },
    }),
  );

  expect(fsmRef.current.currentState).toBe('closed');
});

it('should update currentState after transition', async () => {
  const { result: fsmRef, rerender } = renderHook(() =>
    useFSM({
      initialState: 'closed',
      states: {
        closed: { OPEN: 'opening' },
        opening: { OPEN_FINISH: 'opened' },
        opened: {},
      },
    }),
  );

  await fsmRef.current.send('OPEN');
  rerender();
  await fsmRef.current.send('OPEN_FINISH');
  rerender();
  expect(fsmRef.current.currentState).toBe('opened');
});

it('should not create new fsm on rerender', () => {
  const { result: fsmRef, rerender } = renderHook(() =>
    useFSM({
      initialState: 'closed',
      states: {
        closed: { OPEN: 'opened' },
        opened: {},
      },
    }),
  );

  const firstFsm = fsmRef.current.$fsm;
  rerender();
  expect(fsmRef.current.$fsm).toBe(firstFsm);
});
