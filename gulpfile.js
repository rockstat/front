const gulp = require('gulp');
const ts = require('gulp-typescript');
const nodemon = require('gulp-nodemon');
const del = require('del');
const pinop = require('pino').pretty;
const pretty = require('pino-pretty');


const prettyConfig = {
  colorize: false, // --colorize
  // crlf: false, // --crlf
  // dateFormat: 'yyyy-mm-dd HH:MM:ss.l o', // --dateFormat
  // errorLikeObjectKeys: ['err', 'error'], // --errorLikeObjectKeys
  // errorProps: '', // --errorProps
  levelFirst: false, // --levelFirst
  localTime: false, // --localTime
  // messageKey: 'msg', // --messageKey
  translateTime: true, // --translateTime
  outputStream: process.stdout
}

const tsProject = ts.createProject('tsconfig.json',  { typescript: require('typescript')});

gulp.task("nodemon", function(done) {
  const prettyfier = pretty(prettyConfig);
  const options = {
    watch: [
      "dist/",
      "clientlib/",
      "config/"
    ],
    ext: 'js ts yml',
    script: "dist/start.js",
    ignore: ["node_modules/*"],
    stdout: false,
    readable: false,
    delay: 1
  }
  nodemon(options)
  .on("start", done)
  .on('readable', function() {
    this.stdout.pipe(pinop()).pipe(process.stdout)
    this.stderr.pipe(pinop()).pipe(process.stdout)
  })
  // .on('crash',['clean']);
  // .on('exit',['clean'])
});

gulp.task('clean', function() {
    return del([
      'dist/**/*',
    ]);
});

gulp.task('scripts', function() {
    const tsResult = tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest('dist'));

    return tsResult;
});

gulp.task('build', gulp.series('clean', 'scripts'));


// https://github.com/gulpjs/gulp/blob/4.0/docs/API.md
gulp.task('watch', gulp.series('clean', 'scripts', 'nodemon', function() {
    gulp.watch(['src/**/*.ts'], gulp.series('clean', 'scripts'));
}));
