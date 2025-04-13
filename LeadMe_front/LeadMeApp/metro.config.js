const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// SVG 변환기 설정 추가
const { transformer, resolver } = getDefaultConfig(__dirname);

const config = {
  transformer: {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),  // SVG 변환기 설정
  },
  resolver: {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),  // 기존 assetExts에서 svg를 제거
    sourceExts: [...resolver.sourceExts, 'svg'],  // .svg 확장자 추가
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
