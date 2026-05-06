const c = require('crypto');
global.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
};

Object.defineProperty(globalThis, 'crypto', {
    value: c,
});

