import { expect, it, vi } from 'vitest';
import { createInsideOutPromise } from '../../test-helpers/createInsideOutPromise';
import { flushPromises } from '../../test-helpers/flushPromises';
import { onceAtATime } from '../onceAtATime';

it('should only allow 1 call at a time', async () => {
  const [[p1, p1Resolve], [p2, p2Resolve], [p3, p3Resolve], [p4]] = [
    createInsideOutPromise(),
    createInsideOutPromise(),
    createInsideOutPromise(),
    createInsideOutPromise(),
  ];

  const returns = [p1, p2, p3, p4];
  const fImpl = vi.fn(async () => returns.shift());
  const f = onceAtATime(fImpl);

  f();
  f();
  f();
  f();

  await flushPromises();
  expect(fImpl).toHaveBeenCalledTimes(1);

  p1Resolve();

  await flushPromises();
  expect(fImpl).toHaveBeenCalledTimes(2);

  p2Resolve();

  await flushPromises();
  expect(fImpl).toHaveBeenCalledTimes(3);

  p3Resolve();

  await flushPromises();
  expect(fImpl).toHaveBeenCalledTimes(4);
});

it('should pass on parameters and result', async () => {
  const fImpl = vi.fn((x: number, y: number) => x + y);
  const f = onceAtATime(fImpl);

  expect(await f(1, 2)).toBe(3);
  expect(fImpl).toHaveBeenCalledWith(1, 2);
  expect(await f(2, 3)).toBe(5);
  expect(fImpl).toHaveBeenCalledWith(2, 3);
});
