import { expect, it } from 'vitest';
import { destroyObject } from '../destroy-object';

it('should destroy object', () => {
  const obj = { a: 3, b: { c: 4 } };
  destroyObject(obj);
  expect(obj).toEqual({});
});
