export const onceAtATime = <P extends unknown[], R>(
  f: (...p: P) => R | Promise<R>,
): ((...p: P) => Promise<R>) => {
  let lastPromise: Promise<unknown> = Promise.resolve();

  return async (...payload: P): Promise<R> => {
    const promise = (async () => {
      await lastPromise;
      return await f(...payload);
    })();

    lastPromise = promise;
    return await promise;
  };
};
