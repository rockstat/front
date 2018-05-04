const gulp = require('gulp');
const ts = require('gulp-typescript');
const nodemon = require('gulp-nodemon');
const del = require('del');
const pretty = require('pino').pretty;

const tsProject = ts.createProject('tsconfig.json',  { typescript: require('typescript')});

gulp.task("nodemon", function(done) {
  var options = {
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
    this.stdout.pipe(pretty()).pipe(process.stdout)
    this.stderr.pipe(pretty()).pipe(process.stdout)
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
