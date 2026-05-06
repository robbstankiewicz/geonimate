import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '--type=app',
              onlyDependOnLibsWithTags: ['--type=feature', '--type=ui', '--type=core', '--type=util']
            },
            {
              sourceTag: '--type=feature',
              onlyDependOnLibsWithTags: ['--type=feature', '--type=ui', '--type=core', '--type=util']
            },
            {
              sourceTag: '--type=ui',
              onlyDependOnLibsWithTags: ['--type=ui', '--type=core', '--type=util']
            },
            {
              sourceTag: '--type=core',
              onlyDependOnLibsWithTags: ['--type=core', '--type=util']
            },
            {
              sourceTag: '--type=util',
              onlyDependOnLibsWithTags: ['--type=util']
            },
            {
              sourceTag: '--scope=timeline',
              notDependOnLibsWithTags: ['--scope=config', '--scope=map']
            },
            {
              sourceTag: '--scope=config',
              notDependOnLibsWithTags: ['--scope=timeline', '--scope=map']
            },
            {
              sourceTag: '--scope=map',
              notDependOnLibsWithTags: ['--scope=timeline', '--scope=config']
            }
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
