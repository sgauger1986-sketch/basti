module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      // Im Release-Build werden alle console.*-Aufrufe entfernt,
      // damit keine Daten in System-Logs landen.
      production: { plugins: ['transform-remove-console'] },
    },
  };
};
