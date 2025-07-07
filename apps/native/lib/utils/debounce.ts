import React from 'react';

/**
 * Production-grade debounce utility with TypeScript support and cancellation
 */

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): Promise<ReturnType<T>>;
  cancel(): void;
  flush(): Promise<ReturnType<T> | undefined>;
  isPending(): boolean;
}

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param options - Options object
 * @returns A debounced function with cancel, flush, and isPending methods
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;

  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let timerId: NodeJS.Timeout | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T> | undefined;
  let leadingCalled = false;
  let maxTimerId: NodeJS.Timeout | undefined;

  // Promise handling for async support
  let promiseResolve: ((value: ReturnType<T>) => void) | undefined;
  let promiseReject: ((error: Error) => void) | undefined;
  let currentPromise: Promise<ReturnType<T>> | undefined;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    leadingCalled = false;

    try {
      const functionResult = func.apply(thisArg, args);
      result = functionResult;

      // Resolve the promise if one exists
      if (promiseResolve) {
        promiseResolve(functionResult);
        promiseResolve = undefined;
        promiseReject = undefined;
        currentPromise = undefined;
      }

      return functionResult;
    } catch (error) {
      // Reject the promise if one exists
      if (promiseReject) {
        promiseReject(error as Error);
        promiseResolve = undefined;
        promiseReject = undefined;
        currentPromise = undefined;
      }
      throw error;
    }
  }

  function startTimer(pendingFunc: () => void, wait: number): NodeJS.Timeout {
    return setTimeout(pendingFunc, wait);
  }

  function cancelTimer(id: NodeJS.Timeout | undefined) {
    if (id) {
      clearTimeout(id);
    }
  }

  function leadingEdge(time: number): ReturnType<T> {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = startTimer(timerExpired, wait);
    // Invoke the leading edge.
    return leading && !leadingCalled ? invokeFunc(time) : (result as ReturnType<T>);
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): ReturnType<T> {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result as ReturnType<T>;
  }

  function cancel(): void {
    if (timerId !== undefined) {
      cancelTimer(timerId);
    }
    if (maxTimerId !== undefined) {
      cancelTimer(maxTimerId);
    }

    // Reject any pending promise
    if (promiseReject) {
      promiseReject(new Error('Debounced function was cancelled'));
      promiseResolve = undefined;
      promiseReject = undefined;
      currentPromise = undefined;
    }

    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
    timerId = undefined;
    maxTimerId = undefined;
    leadingCalled = false;
  }

  function flush(): Promise<ReturnType<T> | undefined> {
    if (timerId === undefined) {
      return Promise.resolve(result);
    }

    const time = Date.now();
    const invokeResult = trailingEdge(time);
    return Promise.resolve(invokeResult);
  }

  function isPending(): boolean {
    return timerId !== undefined;
  }

  function debounced(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    // Create a new promise if one doesn't exist
    if (!currentPromise) {
      currentPromise = new Promise<ReturnType<T>>((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
      });
    }

    if (isInvoking) {
      if (timerId === undefined) {
        const leadingResult = leadingEdge(lastCallTime);
        if (leading && !leadingCalled) {
          leadingCalled = true;
          return Promise.resolve(leadingResult);
        }
      }
      if (maxWait !== undefined) {
        maxTimerId = startTimer(() => {
          const maxTime = Date.now();
          if (shouldInvoke(maxTime)) {
            trailingEdge(maxTime);
          }
        }, maxWait);
      }
      return currentPromise;
    }

    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait);
    }

    return currentPromise;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.isPending = isPending;

  return debounced;
}

/**
 * Creates a debounced function optimized for search operations
 */
export function createSearchDebounce<T extends (...args: any[]) => any>(
  searchFunc: T,
  delay: number = 300
): DebouncedFunction<T> {
  return debounce(searchFunc, delay, {
    leading: false,
    trailing: true,
    maxWait: delay * 3, // Prevent too long delays
  });
}

/**
 * Hook for using debounced functions in React components
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options?: DebounceOptions
): DebouncedFunction<T> {
  const debounceRef = React.useRef<DebouncedFunction<T> | null>(null);

  // Initialize debounced function
  React.useEffect(() => {
    debounceRef.current = debounce(func, delay, options);

    return () => {
      debounceRef.current?.cancel();
    };
  }, [func, delay, options]);

  // Create stable reference that always points to current debounced function
  const stableDebounced = React.useCallback(
    (...args: Parameters<T>) => {
      if (debounceRef.current) {
        return debounceRef.current(...args);
      }
      // If no debounced function yet, call original function directly
      return Promise.resolve(func(...args));
    },
    [func]
  ) as DebouncedFunction<T>;

  // Add the utility methods
  stableDebounced.cancel = React.useCallback(() => {
    debounceRef.current?.cancel();
  }, []);

  stableDebounced.flush = React.useCallback(() => {
    if (debounceRef.current) {
      return debounceRef.current.flush();
    }
    return Promise.resolve(undefined);
  }, []);

  stableDebounced.isPending = React.useCallback(() => {
    return debounceRef.current?.isPending() ?? false;
  }, []);

  return stableDebounced;
}

/**
 * Hook for search-specific debouncing
 */
export function useSearchDebounce<T extends (...args: any[]) => any>(
  searchFunc: T,
  delay: number = 300
): DebouncedFunction<T> {
  return useDebounce(searchFunc, delay, {
    leading: false,
    trailing: true,
    maxWait: delay * 3,
  });
}
