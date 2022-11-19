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
        closed: { OPEN: 'opened' },
        opened: {},
      },
    }),
  );

  await fsmRef.current.send('OPEN');

  rerender();

  expect(fsmRef.current.currentState).toBe('opened');
});
