export default {
    displayName: 'shared-core',
    preset: '../../../jest.preset.js',
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    coverageDirectory: '../../../coverage/libs/shared/core',
    transform: {
        '^.+\\.(ts|mjs|js|html)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.(html|svg)$',
                useESM: true,
            },
        ],
    },
    transformIgnorePatterns: [
        'node_modules/(?!.*\\.mjs$|ol|rbush|quickselect|geotiff|quick-lru|observable-fns|nanoid)',
    ],
    extensionsToTreatAsEsm: ['.ts'],
    snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment',
    ],
    moduleFileExtensions: ['ts', 'js', 'html'],
};
