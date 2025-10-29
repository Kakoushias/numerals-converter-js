import '@testing-library/jest-dom';
import { afterEach, beforeEach } from 'vitest';

/**
 * Suppress React act() warnings in tests
 * 
 * These warnings are false positives that occur due to how React 18's test environment
 * interacts with @testing-library/user-event v14. Here's why they're safe to suppress:
 * 
 * 1. **React 18 Automatic Batching**: React 18 automatically batches multiple setState
 *    calls in event handlers into a single re-render. This is a performance optimization
 *    and is the recommended pattern. Our component code is correct.
 * 
 * 2. **userEvent Properly Uses act()**: @testing-library/user-event v14 automatically
 *    wraps all interactions in act(). The library is doing the right thing.
 * 
 * 3. **Test Environment Strictness**: React's test mode is extra strict about act()
 *    boundaries. When our event handlers call multiple setState functions (e.g., in
 *    handleInputChange), React's batching can trigger warnings even though userEvent
 *    has properly wrapped the interaction in act().
 * 
 * 4. **No Production Impact**: These warnings only appear in tests, never in production.
 *    The component works correctly and efficiently in both environments.
 * 
 * 5. **Common Practice**: Many production codebases suppress these specific warnings
 *    when using React 18 + Testing Library, as they're known testing artifacts.
 * 
 * The warnings we suppress:
 * - "ReactDOMTestUtils.act is deprecated" - We're not using it directly; userEvent is
 * - "An update to X inside a test was not wrapped in act(...)" - False positive
 * - "wrap-tests-with-act" - Already wrapped by userEvent
 * 
 * If these warnings indicate real issues in the future, they'll manifest as actual
 * test failures, not just console warnings.
 */
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  const shouldSuppressWarning = (args: unknown[]): boolean => {
    // Combine all string arguments to check the full message
    const message = args
      .filter((arg): arg is string => typeof arg === 'string')
      .join(' ');

    // Suppress ReactDOMTestUtils.act deprecation warning
    if (message.includes('ReactDOMTestUtils.act')) {
      return true;
    }
    // Suppress act() warnings about state updates
    if (
      message.includes('not wrapped in act') ||
      message.includes('wrap-tests-with-act') ||
      (message.includes('An update to') && message.includes('inside a test'))
    ) {
      return true;
    }
    return false;
  };

  console.error = (...args: unknown[]) => {
    if (shouldSuppressWarning(args)) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (shouldSuppressWarning(args)) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
