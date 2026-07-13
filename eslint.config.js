import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react/prop-types': 'off'
    }
  }
];
