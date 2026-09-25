import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any rapidly changing value (e.g. search input).
 * Delays updating the debounced value until after the specified delay in ms.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
