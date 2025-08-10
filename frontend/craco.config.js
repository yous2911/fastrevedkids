const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
    configure: (webpackConfig, { env, paths }) => {
      // Optimize bundle size
      if (env === 'production') {
        // Bundle splitting
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 244000,
            cacheGroups: {
              // Vendor chunk
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
                enforce: true,
              },
              // Three.js separate chunk (large library)
              three: {
                test: /[\\/]node_modules[\\/](three|@types\/three)[\\/]/,
                name: 'three',
                chunks: 'all',
                priority: 20,
                reuseExistingChunk: true,
                enforce: true,
              },
              // React ecosystem
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 15,
                reuseExistingChunk: true,
                enforce: true,
              },
              // UI libraries
              ui: {
                test: /[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/,
                name: 'ui',
                chunks: 'all',
                priority: 12,
                reuseExistingChunk: true,
                enforce: true,
              },
              // Heavy components
              mascot: {
                test: /[\\/]src[\\/]components[\\/](.*Mascot.*|.*Wardrobe.*|.*3D.*)/,
                name: 'mascot-system',
                chunks: 'all',
                priority: 8,
                minSize: 10000,
                reuseExistingChunk: true,
              },
              // Utilities
              utils: {
                test: /[\\/]src[\\/]utils[\\/]/,
                name: 'utilities',
                chunks: 'all',
                priority: 5,
                minSize: 15000,
                reuseExistingChunk: true,
              },
              // Common chunk
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 1,
                reuseExistingChunk: true,
                enforce: true,
              },
            },
          },
          // Tree shaking
          usedExports: true,
          sideEffects: false,
          // Runtime chunk
          runtimeChunk: {
            name: 'runtime',
          },
        };

        // Minimize bundle size
        webpackConfig.resolve.alias = {
          ...webpackConfig.resolve.alias,
          // Use production builds
          'lodash-es': 'lodash',
        };

        // Production optimizations
        webpackConfig.optimization.minimizer = [
          new TerserPlugin({
            terserOptions: {
              parse: {
                ecma: 8,
              },
              compress: {
                ecma: 5,
                warnings: false,
                comparisons: false,
                inline: 2,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log'],
              },
              mangle: {
                safari10: true,
              },
              output: {
                ecma: 5,
                comments: false,
                ascii_only: true,
              },
            },
            parallel: true,
          }),
        ];

        // Compression plugins
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          }),
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            compressionOptions: {
              params: {
                [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
              },
            },
            threshold: 8192,
            minRatio: 0.8,
          })
        );

        // Service Worker for PWA
        webpackConfig.plugins.push(
          new InjectManifest({
            swSrc: path.resolve(__dirname, 'src/sw.js'),
            swDest: 'service-worker.js',
            exclude: [/\.map$/, /asset-manifest\.json$/],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          })
        );

        // Bundle analyzer (optional)
        if (process.env.ANALYZE_BUNDLE) {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: '../bundle-report.html',
            })
          );
        }
      }

      // Module resolution optimizations
      webpackConfig.resolve.extensions = ['.tsx', '.ts', '.js', '.jsx', '.json'];
      
      // Ignore source maps in node_modules for faster builds
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
      ];

      return webpackConfig;
    },
  },
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          // Additional optimizations
          if (process.env.NODE_ENV === 'production') {
            // Compression
            webpackConfig.output.filename = 'static/js/[name].[contenthash:8].js';
            webpackConfig.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
            
            // Cache optimization
            webpackConfig.cache = {
              type: 'filesystem',
              cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
              buildDependencies: {
                config: [__filename],
              },
            };
          }
          return webpackConfig;
        },
      },
    },
  ],
};