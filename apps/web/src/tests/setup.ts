import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver; stub it so Radix UI components
// (e.g. NavigationMenu) can mount without throwing in unit tests.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
