const gulp = require('gulp');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const webpack = require('webpack-stream');
const child = require('child_process');
const del = require('del');
const eslint = require('gulp-eslint');

// //////////////////////////////////////
// BUILDING
// //////////////////////////////////////

const BUILD_TARGET_DIR = './';

function build() {
  return gulp.src('lib/**/*.js')
    .pipe(webpack(require('./support/webpack.config.js')))
    .pipe(gulp.dest(BUILD_TARGET_DIR));
}

exports.default = build;

exports.build = build;

// //////////////////////////////////////
// TESTING
// //////////////////////////////////////

const TEST_FILE = './test/index.js';
const MOCHA_OPTS = {
  reporter: 'dot',
  require: ['./test/support/server.js'],
  bail: true
};
const FILES_TO_CLEAN = [
  'test/support/public/engine.io.js'
];

// gulp.task('test', ['lint'], test);

function test(done) {
  if (process.env.hasOwnProperty('BROWSERS')) {
    return testZuul(done);
  } else {
    return testNode(done);
  }
}

exports.test = gulp.series(lint, test);

// gulp.task('lint', lint);

function lint() {
  return gulp.src([
    '*.js',
    'lib/**/*.js',
    'test/**/*.js',
    '!engine.io.js'
  ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

exports.lint = lint;

// gulp.task('test-node', testNode);
exports['test-node'] = gulp.series(testNode);
// gulp.task('test-zuul', testZuul);
exports['test-zuul'] = gulp.series(testZuul);

function testNode(done) {
  return gulp.src(TEST_FILE, {read: false})
    .pipe(mocha(MOCHA_OPTS))
    // following lines to fix gulp-mocha not terminating (see gulp-mocha webpage)
    .once('error', function (err) {
      console.error(err.stack);
      cleanFiles(FILES_TO_CLEAN);
      done();
      process.exit(1);
    })
    .once('end', function () {
      cleanFiles(FILES_TO_CLEAN);
      done();
      process.exit();
    });
}

// runs zuul through shell process
function testZuul(done) {
  const ZUUL_CMD = './node_modules/zuul/bin/zuul';
  const zuulChild = child.spawn(ZUUL_CMD, [TEST_FILE], {stdio: 'inherit'});
  zuulChild.on('exit', function (code) {
    cleanFiles(FILES_TO_CLEAN);
    if (code === 0) {
      done();
    } else {
      done.fail(code);
    }
  });
}

function cleanFiles(globArray) {
  return del.sync(globArray);
}

// gulp.task('istanbul-pre-test', istanbulPreTest);

function istanbulPreTest() {
  return gulp.src(['lib/**/*.js'])
  // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
}

// gulp.task('test-cov', ['istanbul-pre-test'], testCov);

function testCov(done) {
  return gulp.src(TEST_FILE)
    .pipe(mocha(MOCHA_OPTS))
    .pipe(istanbul.writeReports())
    .once('error', function (err) {
      cleanFiles(FILES_TO_CLEAN);
      console.error(err.stack);
      done.fail();
    })
    .once('end', function () {
      cleanFiles(FILES_TO_CLEAN);
      done();
    });
}

exports['test-cov'] = gulp.series(istanbulPreTest, testCov);
