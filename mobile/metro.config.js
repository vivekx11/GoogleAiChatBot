const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve @runanywhere/* packages to local mocks
// (these are native SDK packages not available on npm)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@runanywhere/core': path.resolve(__dirname, 'mocks/runanywhere/core.js'),
  '@runanywhere/llamacpp': path.resolve(__dirname, 'mocks/runanywhere/llamacpp.js'),
  '@runanywhere/onnx': path.resolve(__dirname, 'mocks/runanywhere/onnx.js'),
};

module.exports = config;
