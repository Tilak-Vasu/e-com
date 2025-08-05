// src/hooks/useLocalStorage.ts

import { useState, useEffect } from 'react';

/**
 * A generic custom hook to sync state with localStorage.
 * @param key The key to use in localStorage.
 * @param defaultValue The initial value to use if nothing is in localStorage.
 * @returns A stateful value, and a function to update it.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return defaultValue;
    } catch {
      // If parsing fails, return the default value
      return defaultValue;
    }
  });

  useEffect(() => {
    // Store the value in localStorage whenever it changes
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}