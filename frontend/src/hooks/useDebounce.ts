// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * A custom hook that delays updating a value until a certain amount of time
 * has passed without that value changing. This is perfect for preventing
 * API calls on every keystroke in a search bar.
 * 
 * @param value The value from your input field (e.g., the searchTerm).
 * @param delay The debounce delay in milliseconds (e.g., 500ms).
 * @returns The debounced value, which only updates after the user stops typing.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to hold the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer that will update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // This is the cleanup function. It runs every time the 'value' or 'delay'
    // changes. It clears the previous timer, preventing it from firing.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // This effect re-runs only if the input value or delay changes

  return debouncedValue;
}