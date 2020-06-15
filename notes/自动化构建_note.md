## 自动化构建

一切重复工作本应自动化

源代码 => 自动化构建 => 生产代码

自动化构建工作流
- 作用：脱离运行环境兼容带来的问题
- 使用提高效率的语法、规范和标准
- + ECMAScript Next
- + Sass
- + 模板引擎
- 构建转换那些不被支持的特性

### 自动化构建初体验
利用 package.json 中的 script 属性，配置一些简单的自动构建命令

```javascript
  "scripts": {
    "build": "sass scss/main.scss css/style.css --watch",
    "serve": "browser-sync . --files \"css/*.css\"",
    "start": "run-p build serve"
  },
```

### 常用的自动化构建工具

- Grunt ，最早的前端构建系统，工作过程是基于临时文件实现的，所以构建速度相对较慢，插件生态非常完善
- Gulp ，构建是基于内存实现的，支持同时执行多个任务，效率较高，使用方式更直观易懂，插件生态也很完善
- FIS ，百度的前端团队推出的前端构建系统，相当于捆绑套餐，将一些典型的需求都集成在内部

### Grunt 的使用

#### Grunt 的基本使用

- 先要安装 grunt ，yarn add grunt
- 在项目根目录创建 Grunt 的入口文件 gruntfile.js
- 用于定义一些需要 Grunt 自动执行的任务
- 需要导出一个函数
- 此函数接收一个 grunt 的形参，内部提供一些创建任务时可以用到的 API

```javascript
// gruntfile.js
module.exports = grunt => {
    grunt.registerTask('foo', () => {
        console.log('hello grunt~');
    });

    grunt.registerTask('bar', '任务描述', () => {
        console.log('other task~');
    });

    grunt.registerTask('default', ['foo', 'bar']);

    // 执行异步任务
    grunt.registerTask('async-task', function () {
        const done = this.async();
        setTimeout(() => {
            console.log('async task working~');
            done();
        }, 3000);
    });
}
```

#### Grunt 标记任务失败

- 在 registerTask 第二个参数，也就是回调函数里 return false 即可
- 处理多个任务，其中一个任务失败的情况，可以用 --force 命令强制执行所有任务
- 异步任务，标记失败的处理：`const done = this.async(); ... done(false);`

#### Grunt 的配置方法

- 使用 grunt.initConfig() 这个方法进行配置
- 在 registerTask 第二个参数，也就是回调函数里通过 grunt.config('foo') 获取配置

```javascript
module.exports = grunt => {
    grunt.initConfig({
        // foo: 'bar'
        foo: {
            bar: 123
        }
    });
    grunt.registerTask('foo', () => {
        // const foo = grunt.config('foo');
        // console.log(foo); // bar
        const bar = grunt.config('foo.bar');
        console.log(bar); // 123
    });
}
```

#### Grunt 多目标任务

- 多目标模式，可以让任务根据配置形成多个子任务
- 通过 grunt.registerMultiTask('build', function () {}) 执行多任务
- 通过 grunt.initConfig({ build: {...} }) 配置多个子任务

#### Grunt 插件的使用

- 先下载相关插件 yarn add grunt-contrib-clean
- 通过 grunt.loadNpmTasks('grunt-contrib-clean') 导入插件
- 通过 grunt.initConfig() 配置插件

```javascript
module.exports = grunt => {
    grunt.initConfig({
        clean: {
            // temp: 'temp/app.js'
            // temp: 'temp/*.txt'
            temp: 'temp/**'
        }
    });
    grunt.loadNpmTasks('grunt-contrib-clean');
}
```

#### Grunt 常用插件介绍

yarn init -yes
yarn add grunt grunt-sass sass --dev
创建 gruntfile.js 文件
yarn grunt sass

yarn add grunt-babel @babel/core @babel/preset-env --dev
yarn add load-grunt-tasks --dev


### Gulp 的使用

#### Gulp 的基本使用

yarn init -yes
yarn add gulp
创建 gulp.js 文件
yarn gulp my-task  执行指定任务
yarn gulp  执行默认的 default 任务

```javascript
// gulpfile.js  gulp 的入口文件

exports.foo = done => {
    console.log('foo task working~');
    done(); // 标识任务完成
}
exports.default = done => {
    console.log('default task working~');
    done();
}

// gulp 4.0 版本之前，创建任务的方式
const gulp = require('gulp');
gulp.task('bar', done => {
    console.log('bar working~');
    done();
});
```

#### Gulp 的组合任务

```javascript
const { series, parallel } = require('gulp');
const task1 = done => {
    setTimeout(() => {
        console.log('task1 working~');
        done();
    }, 1000);
}
// ...
// 创建串行任务
exports.foo = series(task1, task2, task3);

// 创建并行任务
exports.bar = parallel(task1, task2, task3);
```

#### Gulp 的异步任务

```javascript
exports.promise = () => {
    console.log('promise task~');
    return Promise.resolve();
}
exports.promise_error = () => {
    console.log('promise task~');
    return Promise.reject(new Error('task failed!'));
}

const timeout = time => {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
};
exports.async = async () => {
    await timeout(1000);
    console.log('async task~');
}

// 处理文件流
const fs = require('fs');
exports.stream = done => {
    const readStream = fs.createReadStream('package.json');
    const writeStream = fs.createWriteStream('temp.txt');
    readStream.pipe(writeStream);
    readStream.on('end', () => {
        done();
    });
}
```

#### Gulp 构建过程核心原理

输入 => 加工 => 输出
读取流 => 转换流 => 写入流

