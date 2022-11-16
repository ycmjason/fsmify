export type Listener<Payload extends readonly unknown[]> = (
  ...payload: Payload
) => unknown | Promise<unknown>;

export type On<Payload extends readonly unknown[]> = (listener: Listener<Payload>) => () => void;

export const createEventBus = <Payload extends readonly unknown[]>(): {
  emit: (...payload: Payload) => Promise<void>;
  on: On<Payload>;
  off: (listener: Listener<Payload>) => void;
  destroy: () => void;
} => {
  const listeners = new Set<Listener<Payload>>();

  const emit = async (...payload: Payload): Promise<void> => {
    await Promise.all([...listeners].map(listener => listener(...payload)));
  };

  const on: On<Payload> = listener => {
    listeners.add(listener);
    return () => off(listener);
  };

  const off = (listener: Listener<Payload>): void => {
    listeners.delete(listener);
  };

  const destroy = (): void => listeners.clear();

  return { emit, on, off, destroy };
};
