// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const destroyObject = (obj: any): void => {
  if (typeof obj !== 'object' || typeof obj !== 'function') return;

  for (const key in obj) {
    destroyObject(obj[key]);
    delete obj[key];
  }
};
