import { expect, it } from 'vitest';
import { useFSM } from '../use-fsm';
import { mountComposable } from './mount-composable';

it('should set currentState to initial state', () => {
  const [fsm] = mountComposable(() =>
    useFSM({
      initialState: 'closed',
      states: {
        closed: { OPEN: 'opened' },
        opened: {},
      },
    }),
  );

  expect(fsm.currentState.value).toBe('closed');
});

it('should update currentState after transition', async () => {
  const [fsm] = mountComposable(() =>
    useFSM({
      initialState: 'closed',
      states: {
        closed: { OPEN: 'opened' },
        opened: {},
      },
    }),
  );

  await fsm.send('OPEN');

  expect(fsm.currentState.value).toBe('opened');
});
