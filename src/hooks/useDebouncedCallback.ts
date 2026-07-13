import { useRef } from 'react';

export function useDebouncedCallback<T extends (...args: never[]) => void>(callback: T, delay = 500) {
  const timeout = useRef<number | undefined>(undefined);

  return (...args: Parameters<T>) => {
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => callback(...args), delay);
  };
}
