// 实现这个项目的构建任务

const { src, dest, parallel, series, watch } = require('gulp');
const path = require('path');
const minimist = require('minimist'); // 解析命令行参数
const del = require('del');
const Comb = require('csscomb'); // css编码风格格式化
const standard = require('standard'); // js编码风格格式化
const borwserSync = require('browser-sync');
const loadPlugins = require('gulp-load-plugins'); // 自动加载所有的 gulp 插件

const plugins = loadPlugins();
const bs = borwserSync.create();
const argv = minimist(process.argv.slice(2)); // 获取并处理命令行参数

const data = {
    menus: [
      {
        name: 'Home',
        icon: 'aperture',
        link: 'index.html'
      },
      {
        name: 'Features',
        link: 'features.html'
      },
      {
        name: 'About',
        link: 'about.html'
      },
      {
        name: 'Contact',
        link: '#',
        children: [
          {
            name: 'Twitter',
            link: 'https://twitter.com/w_zce'
          },
          {
            name: 'About',
            link: 'https://weibo.com/zceme'
          },
          {
            name: 'divider'
          },
          {
            name: 'About',
            link: 'https://github.com/zce'
          }
        ]
      }
    ],
    pkg: require('./package.json'),
    date: new Date()
}

const clean = () => {
	return del(['dist', 'temp']);
}

const lint = done => {
    const comb = new Comb(require('./.csscomb.json'));
    comb.processPath('src');
    const cwd = path.join(__dirname, 'src');
    standard.lintFiles('assets/scripts/**/*.js', { cwd, fix: true }, done);
}

const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
        .pipe(plugins.sass({ outputStyle: 'expanded' }))
		.pipe(dest('temp'))
		.pipe(bs.reload({ stream: true })); // 以 流 的形式返回
}

const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
        .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
        .pipe(dest('temp'))
		.pipe(bs.reload({ stream: true }));
}

const page = () => {
	// 'src/**/*.html'  匹配到 src 目录以及子目录下所有的html文件
	// .pipe(plugins.swig({ data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
    return src('src/*.html', { base: 'src' })
        .pipe(plugins.swig({ data, defaults: { cache: false } }))
        .pipe(dest('temp'))
		.pipe(bs.reload({ stream: true }));
}

const image = () => {
    return src('src/assets/images/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'));
}

const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'));
}

const extra = () => {
	return src('public/**', { base: 'public' })
		.pipe(dest('dist'));
}

const devServer = () => {
	watch('src/assets/styles/*.scss', style);
	watch('src/assets/scripts/*.js', script);
	watch('src/*.html', page);
	watch([
		'src/assets/images/**',
		'src/assets/fonts/**',
		'public/**'
	], bs.reload);

	bs.init({
		notify: false,
        port: argv.port === undefined ? 2080 : argv.port,
        // open: false,
        open: argv.open === undefined ? false : argv.open,
		// 不使用 files 字段，使用 .pipe(bs.reload({ stream: true })); 也可以
		// files: 'dist/**', // 监听文件的改变
		server: {
			baseDir: ['temp', 'src', 'public'],
			routes: {
				'/node_modules': 'node_modules'
			}
		}
	})
};

const distServer = () => {
    bs.init({
        notify: false,
        port: argv.port === undefined ? 2080 : argv.port,
        open: argv.open === undefined ? false : argv.open,
        server: 'dist'
    });
}

// 使用 useref 之前需要执行 compile 编译
const useref = () => {
	return src('temp/*.html', { base: 'temp' })
		.pipe(plugins.useref({ searchPath: ['temp', '.'] }))
		.pipe(plugins.if(/\.js$/, plugins.uglify()))
		.pipe(plugins.if(/\.css$/, plugins.cleanCss()))
		.pipe(plugins.if(/\.html$/, plugins.htmlmin({
			collapseWhitespace: true,
			minifyCSS: true,
			minifyJS: true
		})))
		.pipe(dest('dist')); // 这里文件名最好不要跟 dist 相同，防止文件读写冲突
}

const compile = parallel(style, script, page);

const serve = series(compile, devServer);

// 上线之前执行的任务。将 image, font 的任务放在这里
const build = series(
    clean,
    parallel(
        series(compile, useref),
        image,
        font,
        extra
    )
);

const start = series(build, distServer);

module.exports = {
    clean,
    lint,
    serve,
	build,
	start
}
