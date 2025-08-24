import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for debouncing search input
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300)
 * @returns The debounced value
 */
export function useDebounced<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Enhanced search hook with loading state and cancellation
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds
 * @returns Object with search value, debounced value, loading state, and setter
 */
export function useSearchWithDebounce(
    initialValue: string = '',
    delay: number = 300
) {
    const [searchValue, setSearchValue] = useState(initialValue);
    const [isSearching, setIsSearching] = useState(false);

    const debouncedValue = useDebounced(searchValue, delay);

    // Track when search is in progress
    useEffect(() => {
        if (searchValue !== debouncedValue) {
            setIsSearching(true);
        } else {
            setIsSearching(false);
        }
    }, [searchValue, debouncedValue]);

    const clearSearch = () => {
        setSearchValue('');
        setIsSearching(false);
    };

    return useMemo(() => ({
        searchValue,
        debouncedValue,
        isSearching,
        setSearchValue,
        clearSearch,
    }), [searchValue, debouncedValue, isSearching]);
}