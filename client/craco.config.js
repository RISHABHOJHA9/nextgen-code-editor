const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.plugins.push(
        new MonacoWebpackPlugin({
          languages: ['javascript', 'python', 'java', 'cpp'],  // Add other languages you want to support
          features: ['coreCommands', 'find'],
        })
      );
      return webpackConfig;
    },
  },
};
