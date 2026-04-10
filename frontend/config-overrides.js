// config-overrides.js
// Webpack configuration overrides (replaces craco.config.js)

const path = require('path');

module.exports = function override(config, env) {
  // Add path aliases
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };

  // Add watch options to improve dev server performance
  if (env === 'development') {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/build/**',
        '**/dist/**',
        '**/coverage/**',
        '**/public/**',
      ],
    };
  }

  return config;
};
