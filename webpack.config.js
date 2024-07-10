const path = require('path');

module.exports = {
    entry: {
        content: './src/content/content.js',
        popup: './src/popup/popup.js',
        options: './src/options/options.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],
    },
};