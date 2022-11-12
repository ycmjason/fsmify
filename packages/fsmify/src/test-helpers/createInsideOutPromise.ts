export const createInsideOutPromise = <T = void>(): [
  promise: Promise<T>,
  resolve: (t: T) => void,
  reject: (reason: unknown) => void,
] => {
  let resolve: (t: T) => void, reject: (reason: unknown) => void;
  const p = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return [
    p,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore promise callback is sync so it will be assigned
    resolve,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore promise callback is sync so it will be assigned
    reject,
  ];
};
