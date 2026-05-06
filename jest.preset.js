const nxPreset = require('@nx/jest/preset').default;

const path = require('path');

module.exports = {
    ...nxPreset,
    transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
    setupFiles: [path.resolve(__dirname, 'test-setup.ts')],
};
