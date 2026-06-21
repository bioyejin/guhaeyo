const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('csv');

// Web 빌드에서 eval 기반 인라인 소스맵 비활성화 (CSP 'unsafe-eval' 불필요하게 만듦)
config.transformer = {
  ...config.transformer,
  inlineSourceMap: false,
};

module.exports = config;
