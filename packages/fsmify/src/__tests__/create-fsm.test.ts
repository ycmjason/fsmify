import { it, expect, vi, describe } from 'vitest';
import { createFSM } from '../create-fsm';
import { createInsideOutPromise } from '../test-helpers/createInsideOutPromise';
import { flushPromises } from '../test-helpers/flushPromises';

it('should initiate stae with accordance to initialState ', () => {
  const fsm = createFSM({
    initialState: 'init',
    states: {
      init: { move: 'moving' },
      moving: {},
    },
  });

  expect(fsm.getCurrentState()).toBe('init');
});

describe('state transitions', () => {
  it('should move to new state when receiving valid event', async () => {
    const fsm = createFSM({
      initialState: 'init',
      states: {
        init: { move: 'moving' },
        moving: {},
      },
    });

    await fsm.send('move');

    expect(fsm.getCurrentState()).toBe('moving');
  });

  it('should ignore invalid event', async () => {
    const fsm = createFSM({
      initialState: 'init',
      states: {
        init: { stand: 'standing' },
        standing: { walk: 'walking', jump: 'inAir' },
        walking: {},
        inAir: {},
      },
    });

    await fsm.send('walk');

    expect(fsm.getCurrentState()).toBe('init');
  });
});

describe('event listening', () => {
  it.each([
    {
      hookName: 'onBeforeAllTransition',
      hookArgs: [],
      sendEvent: 'move',
      expected: {
        stateInListener: 'init',
        payload: { fromState: 'init', toState: 'moving', event: 'move' },
      },
    },
    {
      hookName: 'onAfterAllTransition',
      hookArgs: [],
      sendEvent: 'move',
      expected: {
        stateInListener: 'moving',
        payload: { fromState: 'init', toState: 'moving', event: 'move' },
      },
    },
    {
      hookName: 'onBeforeTransition',
      hookArgs: ['jump'],
      sendEvent: 'jump',
      expected: {
        stateInListener: 'init',
        payload: { fromState: 'init', toState: 'jumping', event: 'jump' },
      },
    },
    {
      hookName: 'onAfterTransition',
      hookArgs: ['jump'],
      sendEvent: 'jump',
      expected: {
        stateInListener: 'jumping',
        payload: { fromState: 'init', toState: 'jumping', event: 'jump' },
      },
    },
    {
      hookName: 'onBeforeEnterState',
      hookArgs: ['moving'],
      sendEvent: 'move',
      expected: {
        stateInListener: 'init',
        payload: { fromState: 'init', toState: 'moving', event: 'move' },
      },
    },
    {
      hookName: 'onAfterEnterState',
      hookArgs: ['moving'],
      sendEvent: 'move',
      expected: {
        stateInListener: 'moving',
        payload: { fromState: 'init', toState: 'moving', event: 'move' },
      },
    },
    {
      hookName: 'onBeforeLeaveState',
      hookArgs: ['init'],
      sendEvent: 'move',
      expected: {
        stateInListener: 'init',
        payload: { fromState: 'init', toState: 'moving', event: 'move' },
      },
    },
    {
      hookName: 'onAfterLeaveState',
      hookArgs: ['init'],
      sendEvent: 'move',
      expected: {
        stateInListener: 'moving',
        payload: { fromState: 'init', toState: 'moving', event: 'move' },
      },
    },
  ] as const)(
    'should call listener for $hookName before/after transition correctly, with correct payload',
    async ({ hookName, hookArgs, sendEvent, expected }) => {
      const fsm = createFSM({
        initialState: 'init',
        states: {
          init: { move: 'moving', jump: 'jumping' },
          moving: {},
          jumping: {},
        },
      });

      const listener = vi.fn(payload => {
        expect(fsm.getCurrentState()).toBe(expected.stateInListener);
        expect(payload).toEqual(expected.payload);
      });

      fsm[hookName](
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: typescript couldn't figure out the type of hookArgs given hookName
        ...hookArgs,
        listener,
      );

      await fsm.send(sendEvent);

      expect(listener).toHaveBeenCalledOnce();
    },
  );

  it.each([
    { hookName: 'onBeforeTransition', hookArgs: ['jump'], sendEvent: 'move' },
    { hookName: 'onAfterTransition', hookArgs: ['jump'], sendEvent: 'move' },
    { hookName: 'onBeforeEnterState', hookArgs: ['jumping'], sendEvent: 'move' },
    { hookName: 'onAfterEnterState', hookArgs: ['jumping'], sendEvent: 'move' },
  ] as const)(
    'should not call listener for $hookName when the transition does not match',
    async ({ hookName, hookArgs, sendEvent }) => {
      const fsm = createFSM({
        initialState: 'init',
        states: {
          init: { move: 'moving', jump: 'jumping' },
          moving: {},
          jumping: {},
        },
      });

      const listener = vi.fn();

      fsm[hookName](
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: typescript couldn't figure out the type of hookArgs given hookName
        ...hookArgs,
        listener,
      );

      await fsm.send(sendEvent);

      expect(listener).not.toHaveBeenCalled();
    },
  );

  it('should wait for all listeners (including async) to finish before resolving send', async () => {
    const fsm = createFSM({
      initialState: 'init',
      states: {
        init: { move: 'moving' },
        moving: {},
      },
    });

    const [beforePromise1, beforePromise1Resolve] = createInsideOutPromise();
    const [beforePromise2, beforePromise2Resolve] = createInsideOutPromise();
    const [afterPromise1, afterPromise1Resolve] = createInsideOutPromise();
    const [afterPromise2, afterPromise2Resolve] = createInsideOutPromise();

    const beforeListeners = [vi.fn(() => beforePromise1), vi.fn(() => beforePromise2)] as const;
    const afterListeners = [vi.fn(() => afterPromise1), vi.fn(() => afterPromise2)] as const;

    fsm.onBeforeEnterState('moving', beforeListeners[0]);
    fsm.onBeforeLeaveState('init', beforeListeners[1]);
    fsm.onAfterAllTransition(afterListeners[0]);
    fsm.onAfterTransition('move', afterListeners[1]);

    const sendCb = vi.fn();
    const promise = fsm.send('move').then(sendCb);

    await flushPromises();
    expect(sendCb).not.toHaveBeenCalled();
    expect(beforeListeners[0]).toHaveBeenCalledOnce();
    expect(beforeListeners[1]).toHaveBeenCalledOnce();
    expect(afterListeners[0]).not.toHaveBeenCalledOnce();
    expect(afterListeners[1]).not.toHaveBeenCalledOnce();

    beforePromise1Resolve();
    await flushPromises();
    expect(fsm.getCurrentState()).toBe('init');
    expect(sendCb).not.toHaveBeenCalled();

    beforePromise2Resolve();
    await flushPromises();
    expect(fsm.getCurrentState()).toBe('moving');
    expect(sendCb).not.toHaveBeenCalled();
    expect(afterListeners[0]).toHaveBeenCalledOnce();
    expect(afterListeners[1]).toHaveBeenCalledOnce();

    afterPromise1Resolve();
    await flushPromises();
    expect(sendCb).not.toHaveBeenCalled();

    afterPromise2Resolve();
    await flushPromises();
    expect(sendCb).toHaveBeenCalledOnce();

    await promise;
  });
});

it('should send only 1 event at a time', async () => {
  const fsm = createFSM({
    initialState: 'init',
    states: {
      init: { move: 'moving', jump: 'jumping' },
      moving: { jump: 'jumpingAndMoving' },
      jumping: {},
      jumpingAndMoving: {},
    },
  });

  await Promise.all([fsm.send('move'), fsm.send('jump')]);
  expect(fsm.getCurrentState()).toBe('jumpingAndMoving');
});

it('type: should allow listener return anything', () => {
  const fsm = createFSM({
    initialState: 'init',
    states: {
      init: { move: 'moving' },
      moving: {},
    },
  });
  fsm.onAfterAllTransition(() => 3);
});

it('should destroy everything', () => {
  const fsm = createFSM({ initialState: 'init', states: { init: {} } });
  fsm.destroy();
  expect(fsm).toEqual({});
});
