const options = require('./webpack.dev')({ isTest: true });

module.exports = function (wallaby) {
  return {
    // set `load: false` to all source files and tests processed by webpack
    // (except external files),
    // as they should not be loaded in browser,
    // their wrapped versions will be loaded instead
    files: [
      { pattern: 'src/**/*.js', load: false },
      { pattern: 'src/**/*.ts', load: false },
      { pattern: 'src/**/*.html', load: false },
      { pattern: 'webpack-config/*.js', load: false },
      { pattern: 'test/karma/helpers.js', load: false },
      { pattern: 'test/karma/runtimeError.js', load: false },
      { pattern: 'test/karma/simulateMaskedRuntimeError.js', load: false },

      // ignore test files since they get declared in the "tests" option
      { pattern: 'src/**/test/e2e/**/*.{js,ts}', ignore: true },
      { pattern: 'src/**/test/midway/**/*.{js,ts}', ignore: true },
      { pattern: 'src/**/test/unit/**/*.helpers.{js,ts}', ignore: true },
      { pattern: 'src/**/*.spec.ts', ignore: true },
    ],

    tests: [
      { pattern: 'src/**/test/unit/**/!(*.helpers).{js,ts}', load: false },
      { pattern: 'src/**/*.spec.ts', load: false },
    ],

    postprocessor: wallaby.postprocessors.webpack(options),

    setup: function () {
      // required to trigger test loading
      window.__moduleBundler.loadTests();
    },
  };
};
