/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: [
    'react-native',
    'react-native-web',
    'expo',
    '@expo/dom-webview',
    '@expo/metro-runtime',
    '@expo/webpack-config',
    'react-native-webview'
  ],
  webpack: (config) => {
    // 避免 Expo 套件引起的警告
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web'
    };
    
    return config;
  }
};

module.exports = nextConfig;
