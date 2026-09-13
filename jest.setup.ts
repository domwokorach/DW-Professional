import './test/setupEnv';
import '@testing-library/jest-dom';

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (!('ResizeObserver' in window)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error - jsdom has no ResizeObserver implementation
    window.ResizeObserver = ResizeObserverStub;
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  if (!window.PointerEvent) {
    // @ts-expect-error - jsdom lacks PointerEvent; Radix relies on it
    window.PointerEvent = window.MouseEvent;
  }

  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    value: () => false,
    writable: true,
  });
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    value: () => {},
    writable: true,
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    value: () => {},
    writable: true,
  });
}
