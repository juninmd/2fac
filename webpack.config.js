import webpack from 'webpack';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
    entry: './src/renderer/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist/renderer'),
        filename: 'bundle.js',
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            crypto: path.resolve(require.resolve('crypto-browserify')),
            stream: path.resolve(require.resolve('stream-browserify')),
            util: path.resolve(require.resolve('util/')),
            url: path.resolve(require.resolve('url/')),
            buffer: path.resolve(require.resolve('buffer/')),
            vm: path.resolve(require.resolve('vm-browserify')),
            process: path.resolve(require.resolve('process/browser')),
        },
    },
    devServer: {
        port: 3000,
        historyApiFallback: true,
        hot: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser',
        }),
    ],
    target: 'web',
};
