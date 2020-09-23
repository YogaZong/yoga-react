module.exports = {
  entry: {
    main: './main.js'
  },
  mode: 'development',
  optimization: {
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader', // babel-loader
          options: {
            presets: ['@babel/preset-env'], // preset config of babel
            // transform react-jsx to js, pragma: replace func name 'React.createElement' to 'createElement'
            plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'createElement' }]]
          }
        }
      }
    ]
  }
}
