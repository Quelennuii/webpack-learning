// webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InjectTemplate = require("./InjectTemplate");

module.exports = {
  // process是node.js中的一个全局变量，它返回当前进程的相关信息
  // process.env包含着关于系统环境的信息
  // NODE_ENV是用户自定义的一个变量，在webpack中它的作用是用来判断生产环境或开发环境
  mode: process.env.NODE_ENV,
  // 入口文件
  entry: "./src/index.js",
  // 输出
  output: {
    // 文件名
    filename: "index.js",
    // 路径，__dirname是node.js中的一个全局变量，它指向当前执行脚本所在的目录
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      // 可以在模板文件中使用<%= htmlWebpackPlugin.options.title %>来获取，定义title
      title: "Webpack Template",
      // 输出文件名，根路径是module.exports.output.path
      filename: "index.html",
      // 模板文件
      template: path.resolve("./public/index.html"),
      // 是否添加hash，默认为false，这个hash是和文件内容相关的，只要文件内容不变，hash就不变
      hash: true,
      // 压缩
      minify: {
        // 是否删除注释
        collapseWhitespace: true,
        // 是否删除空格
        removeAttributeQuotes: true,
        // 是否删除属性的引号
        minifyCSS: true,
        // 是否压缩html里的css（使用clean-css进行的压缩）
        minifyJS: true,
      },
      // inject: true | 'head' | 'body' | false
      // true：默认值，script标签位于html文件的 body 底部
      // head：script标签位于 head 标签内
      // body：script标签位于 body 标签内
      // false：不插入生成的 js 文件，只是单纯的生成一个 html 文件
      inject: "body",
      // 加载js的方式，`blocking`、`defer`
      // `blocking`：当浏览器遇到script标签时，会停止解析html，直到加载完script标签里的js文件
      // `defer`：当浏览器遇到script标签时，会继续解析html，直到解析完html再加载js文件
      scriptLoading: "blocking",
    }),
    new InjectTemplate({
      // InjectTemplate会从这个 URL 下载模板，然后将模板的内容注入到你的代码中。
      // 这个 URL 通常应该指向你的开发服务器，你可以在这个服务器上提供你的模板文件。
      url: "http://www.test.com",
    }),
  ],
};