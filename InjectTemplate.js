// chrome://inspect, 在 "Remote Target" 部分
// 点击 "inspect" 链接来打开一个新的调试窗口。

// 用来模拟异步请求数据
const RemoteData = (key) => {
  const data = {
    header: "<div>THIS IS HEADER</div>",
    footer: "<div>THIS IS FOOTER</div>",
  };
  return Promise.resolve(data[key]);
};

class InjectTemplate {
  // 用来接收配置参数
  constructor(options) {
    this.options = options || {};
  }
  // apply是一个插件必须的方法，它会在webpack启动时自动调用
  apply(compiler) {
    // thisCompilation 是一个异步钩子，当编译创建新的compilation实例时触发
    // tapn 方法的第一个参数是插件名称，第二个参数是回调函数
    compiler.hooks.thisCompilation.tap("InjectTemplate", (compilation) => {
      // processAssets 是一个异步钩子，当生成资源到 output 目录时触发
      // tapPromise 方法的第一个参数是插件名称，第二个参数是回调函数
      compilation.hooks.processAssets.tapPromise(
        {
          name: "InjectTemplate",
          // 在资源添加到输出目录之前执行
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_ADDITIONS,
          // additionalAssets 为 true 时，表示插件会生成额外的资源
          additionalAssets: true,
        },
        // assets 是一个对象，包含了所有即将输出的资源
        // 调用replaceAssets方法，修改资源
        (assets) => this.replaceAssets(assets, compilation)
      );
    });
  }

  // 用来修改资源
  replaceAssets(assets, compilation) {
    return new Promise((resolve) => {
      //如果不想使用远程数据，可以使用cache来存储数据，直接读取
      const cache = {};
      // 获取资源的key，即资源的路径
      const assetKeys = Object.keys(assets);
      for (const key of assetKeys) {
        // replaceAssets方法需要在所有的资源都处理完毕后标记为完成
        // 所以需要判断是否是最后一个资源
        const isLastAsset = key === assetKeys[assetKeys.length - 1];
        // 如果不是html文件，直接跳过
        if (!/.*\.html$/.test(key)) {
          // 如果是最后一个资源，调用resolve方法
          if (isLastAsset) {
            resolve();
          }
          continue;
        }
        // 获取当前资源的内容
        let target = assets[key].source();
        // 匹配资源中的注释是否包含replace属性，即是否需要替换
        // matchAll 生成所有与正则表达式匹配的字符串
        const matchedValues = target.matchAll(/<!-- replace="(\S*?)" -->/g);
        const tags = [];
        for (const item of matchedValues) {
          // item[0]是匹配到的字符串，item[1]是匹配到的分组
          const [tag, name] = item;
          tags.push({
            tag,
            name,
            // 默认使用cache中的数据，如果没有，使用远程数据
            data: cache[name] ? cache[name] : RemoteData(name),
          });
        }
        // 等待异步请求数据完成
        Promise.all(tags.map((item) => item.data))
          .then((res) => {
            res.forEach((data, index) => {
              // 将数据替换到资源中
              const tag = tags[index].tag;
              const name = tags[index].name;
              if (!cache[name]) cache[name] = data;
              // 替换匹配到的字符串
              target = target.replace(tag, data);
            });
          })
          .then(() => {
            // 将修改后的资源添加到compilation.assets中
            compilation.assets[key] = {
              // 返回资源的内容
              source() {
                return target;
              },
              // 返回资源的大小
              size() {
                return this.source().length;
              },
            };
          })
          .then(() => {
            // 如果是最后一个资源，调用resolve方法
            if (isLastAsset) resolve();
          });
      }
    });
  }
}

module.exports = InjectTemplate;
