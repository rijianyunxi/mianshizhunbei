const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production';
console.log('isProduction', isProduction);

module.exports = {
    mode: isProduction ? 'production' : 'development',
    devtool:isProduction ? false : 'source-map',
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'bundle.js',
        clean: true,
    },
    module: {
        rules: [
            // TS处理
            {
                test: /\.ts$/,
                exclude: /node_modules|dist/,
                use: [
                    {
                        loader: 'babel-loader',
                        // options: {
                        //     presets: ['@babel/preset-env'],
                        // }
                    },
                    {
                        loader: 'ts-loader',
                    }
                ]
            },

            // JS处理
            {
                test: /\.js$/,
                exclude: /node_modules|dist/,
                use: [
                    {
                        loader: 'babel-loader',
                        // options: {
                        //     presets: ['@babel/preset-env']
                        // }
                    }
                ]
            },

            // CSS 处理（不走 sass-loader）
            {
                test: /\.css$/,
                exclude: /node_modules|dist/,
                use: [
                    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [require('autoprefixer')],
                            }
                        }
                    }
                ]
            },

            // SCSS/SASS 处理
            {
                test: /\.(scss|sass)$/,
                exclude: /node_modules|dist/,
                use: [
                    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [require('autoprefixer')],
                            }
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass'),
                            sourceMap: !isProduction,
                            sassOptions: {
                                api: 'modern-compiler',   // 新 API，不会产生 warning
                            },
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css'
        }),
        new HtmlWebpackPlugin({
            template: "./index.html"
        }),
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, '../dist'),
        },
        compress: true,
        port: 9000,
        open: true,
        hot: true,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            '@': path.resolve(__dirname, './src/'),
        }
    },
}
