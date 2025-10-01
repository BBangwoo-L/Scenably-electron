"use client"

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 비동기 상태를 관리하는 훅입니다.
 * 데이터, 로딩 상태, 에러를 함께 관리하며 리셋 기능을 제공합니다.
 *
 * @template T - 데이터 타입
 * @returns 상태와 상태 변경 함수들
 *
 * @example
 * const { data, loading, error, setData, setLoading, setError, reset } = useAsyncState<User>();
 *
 * const fetchUser = async () => {
 *   setLoading(true);
 *   try {
 *     const user = await api.getUser();
 *     setData(user);
 *   } catch (err) {
 *     setError(err.message);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 */
export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    setData,
    setLoading,
    setError,
    reset
  };
}

/**
 * 값이 변경될 때 지연시간을 두고 업데이트하는 디바운스 훅입니다.
 * 검색 입력 등에서 API 호출을 제한할 때 유용합니다.
 *
 * @template T - 값의 타입
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (밀리초)
 * @returns 디바운스된 값
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // API 호출
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export function useDebounce<T>(value: T, delay: number): T {
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
 * localStorage와 동기화되는 상태를 관리하는 훅입니다.
 *
 * @template T - 저장할 값의 타입
 * @param key - localStorage 키
 * @param initialValue - 초기값
 * @returns [저장된 값, 값 설정 함수]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * const toggleTheme = () => {
 *   setTheme(theme === 'light' ? 'dark' : 'light');
 * };
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * boolean 상태를 토글하는 훅입니다.
 *
 * @param initialValue - 초기값 (기본값: false)
 * @returns [현재 값, 토글 함수, 직접 설정 함수]
 *
 * @example
 * const [isOpen, toggleOpen, setIsOpen] = useToggle(false);
 *
 * return (
 *   <div>
 *     <button onClick={toggleOpen}>
 *       {isOpen ? 'Close' : 'Open'}
 *     </button>
 *     <button onClick={() => setIsOpen(true)}>
 *       Force Open
 *     </button>
 *   </div>
 * );
 */
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setToggle = useCallback((value: boolean) => {
    setValue(value);
  }, []);

  return [value, toggle, setToggle];
}

/**
 * 이전 렌더링의 값을 기억하는 훅입니다.
 *
 * @template T - 값의 타입
 * @param value - 추적할 값
 * @returns 이전 값 (첫 렌더링에서는 undefined)
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * useEffect(() => {
 *   if (prevCount !== undefined) {
 *     console.log(`Count changed from ${prevCount} to ${count}`);
 *   }
 * }, [count, prevCount]);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * 미디어 쿼리 매칭 상태를 추적하는 훅입니다.
 *
 * @param query - 미디어 쿼리 문자열
 * @returns 미디어 쿼리가 매칭되는지 여부
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     Content
 *   </div>
 * );
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [query]);

  return matches;
}