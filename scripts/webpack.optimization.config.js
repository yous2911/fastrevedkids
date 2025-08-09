/**
 * Webpack Optimization Configuration
 * Integrates all bundle optimization strategies
 */

const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    // Optimization configuration
    optimization: {
      minimize: isProduction,
      minimizer: [
        // Optimize JavaScript
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.warn'],
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        
        // Optimize CSS
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                colormin: true,
                convertValues: true,
                discardDuplicates: true,
                discardEmpty: true,
                mergeRules: true,
                minifySelectors: true,
              },
            ],
          },
        }),
      ],

      // Advanced code splitting
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          
          // Three.js specific chunk (large library)
          three: {
            test: /[\\/]node_modules[\\/]three[\\/]/,
            name: 'three',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
          
          // React ecosystem
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          
          // Animation libraries
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|@react-spring)[\\/]/,
            name: 'animations',
            chunks: 'all',
            priority: 12,
            reuseExistingChunk: true,
          },
          
          // Common shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
          
          // CSS chunk
          styles: {
            type: 'css/mini-extract',
            name: 'styles',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
        },
      },

      // Runtime chunk for better caching
      runtimeChunk: {
        name: 'runtime',
      },

      // Tree shaking
      usedExports: true,
      sideEffects: [
        '*.css',
        '*.scss',
        '*.sass',
        '*.less',
      ],
    },

    // Module resolution optimization
    resolve: {
      // Optimize Three.js imports
      alias: {
        'three': path.resolve(__dirname, 'frontend/src/utils/threeOptimized'),
        'three/examples': path.resolve(__dirname, 'node_modules/three/examples'),
      },
      
      // Speed up module resolution
      modules: [
        path.resolve(__dirname, 'frontend/src'),
        'node_modules',
      ],
      
      // Optimize extension resolution
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      
      // Fallbacks for better tree-shaking
      fallback: {
        "path": false,
        "fs": false,
      },
    },

    // Module rules with optimizations
    module: {
      rules: [
        // TypeScript/JavaScript optimization
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: {
                        browsers: ['> 1%', 'last 2 versions'],
                      },
                      modules: false, // Keep ES6 modules for tree-shaking
                      useBuiltIns: 'entry',
                      corejs: 3,
                    },
                  ],
                  '@babel/preset-react',
                  '@babel/preset-typescript',
                ],
                plugins: [
                  // Optimize imports
                  ['import', {
                    libraryName: 'lodash',
                    libraryDirectory: '',
                    camel2DashComponentName: false,
                  }, 'lodash'],
                  
                  // Remove prop-types in production
                  ...(isProduction ? [['babel-plugin-transform-remove-prop-types', { removeImport: true }]] : []),
                  
                  // Optimize React
                  ...(isProduction ? [['babel-plugin-transform-react-remove-prop-types']] : []),
                ],
                cacheDirectory: true,
                cacheCompression: false,
              },
            },
          ],
        },

        // CSS optimization
        {
          test: /\.css$/,
          use: [
            // Extract CSS in production
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: (resourcePath) => resourcePath.includes('.module.'),
                  localIdentName: isProduction ? '[hash:base64:5]' : '[name]__[local]--[hash:base64:5]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    'tailwindcss',
                    'autoprefixer',
                    ...(isProduction ? [
                      ['cssnano', {
                        preset: ['default', {
                          discardComments: { removeAll: true },
                          normalizeWhitespace: true,
                        }],
                      }],
                    ] : []),
                  ],
                },
              },
            },
          ],
        },

        // Asset optimization
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb - inline small images
            },
          },
          generator: {
            filename: 'assets/images/[name].[contenthash:8][ext]',
          },
          use: [
            {
              loader: 'image-webpack-loader',
              options: {
                mozjpeg: {
                  progressive: true,
                  quality: 80,
                },
                optipng: {
                  enabled: false,
                },
                pngquant: {
                  quality: [0.6, 0.8],
                },
                gifsicle: {
                  interlaced: false,
                },
                webp: {
                  quality: 85,
                },
                svgo: {
                  plugins: [
                    {
                      name: 'removeViewBox',
                      active: false,
                    },
                  ],
                },
              },
            },
          ],
        },

        // Font optimization
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[contenthash:8][ext]',
          },
        },
      ],
    },

    // Plugins for optimization
    plugins: [
      // Extract CSS
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
          chunkFilename: 'css/[name].[contenthash:8].chunk.css',
        }),
      ] : []),

      // Compression
      ...(isProduction ? [
        // Gzip compression
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
        }),
        
        // Brotli compression (if supported)
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: {
            level: 11,
          },
          threshold: 8192,
          minRatio: 0.8,
        }),
      ] : []),

      // Bundle analyzer (only when analyzing)
      ...(process.env.ANALYZE ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html',
          generateStatsFile: true,
          statsFilename: 'bundle-stats.json',
        }),
      ] : []),
    ],

    // Performance budgets
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000, // 500kb
      maxAssetSize: 512000, // 500kb
      assetFilter: (assetFilename) => {
        // Only check JavaScript and CSS files
        return /\.(js|css)$/.test(assetFilename);
      },
    },

    // Development server optimization
    devServer: isDevelopment ? {
      compress: true,
      hot: true,
      liveReload: false, // Use HMR instead
      static: {
        directory: path.join(__dirname, 'frontend/public'),
        publicPath: '/',
      },
      devMiddleware: {
        writeToDisk: false,
      },
    } : undefined,

    // Output optimization
    output: {
      filename: isProduction 
        ? 'js/[name].[contenthash:8].js'
        : 'js/[name].js',
      chunkFilename: isProduction
        ? 'js/[name].[contenthash:8].chunk.js'
        : 'js/[name].chunk.js',
      assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
      clean: true,
      pathinfo: false, // Improve build performance
    },

    // Cache configuration for faster builds
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
      buildDependencies: {
        config: [__filename],
      },
    },

    // Stats configuration
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false,
      excludeAssets: /\.(map|txt|html|jpg|png|svg)$/,
    },

    // Experiments for cutting-edge optimizations
    experiments: {
      // Enable top-level await
      topLevelAwait: true,
      
      // Output module (for better tree-shaking)
      outputModule: false,
    },
  };
};