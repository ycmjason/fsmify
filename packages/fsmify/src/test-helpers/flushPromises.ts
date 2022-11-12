export const flushPromises = (): Promise<void> => new Promise(res => setTimeout(res, 0));
