import tapOut from 'tap-out';
import through from 'through2';
import duplexer from 'duplexer';
import format from 'chalk';
import prettyMs from 'pretty-ms';
import _ from 'lodash';
import symbols from 'figures';

export default function (spec = {}) {
  let OUTPUT_PADDING = spec.padding || '  ';

  let output = through();
  let parser = tapOut();
  let stream = duplexer(parser, output);
  let startTime = new Date().getTime();

  output.push('\n');

  parser.on('test', function (test) {

    output.push('\n' + pad(format.underline(test.name)) + '\n\n');
  });

  // Passing assertions
  parser.on('pass', function (assertion) {

    if (/# SKIP/.test(assertion.name)) {
      let name = assertion.name.replace(' # SKIP', '')
      name = format.cyan('- ' + name);

      output.push(pad('  ' + name + '\n'));
    }
    else {
      let glyph = format.green(symbols.tick);
      let name = format.dim(assertion.name);

      output.push(pad('  ' + glyph + ' ' + name + '\n'));
    }

  });

  // Failing assertions
  parser.on('fail', function (assertion) {

    let glyph = symbols.cross;
    let title =  glyph + ' ' + assertion.name;
    let raw = format.cyan(prettifyRawError(assertion.error.raw));
    let divider = _.fill(
      new Array((title).length + 1),
      '-'
    ).join('');

    output.push('\n' + pad('  ' + format.red(title) + '\n'));
    output.push(pad('  ' + format.red(divider) + '\n'));
    output.push(raw);

    stream.failed = true;
  });

  parser.on('comment', function (comment) {

    output.push(pad('  ' + format.yellow(comment.raw)) + '\n');
  });

  // All done
  parser.on('output', function (results) {

    output.push('\n\n');

    // Most likely a failure upstream
    if (results.plans.length < 1) {
      process.exit(1);
    }

    if (results.fail.length > 0) {
      output.push(formatErrors(results));
      output.push('\n');
    }

    output.push(formatTotals(results));
    output.push('\n\n\n');

    // Exit if no tests run. This is a result of 1 of 2 things:
    //  1. No tests and asserts were written
    //  2. There was some error before the TAP got to the parser
    if (results.tests.length === 0 &&
        results.asserts.length === 0) {
      process.exit(1);
    }
  });

  // Utils

  function prettifyRawError (rawError) {

    return rawError.split('\n').map(function (line) {

      return pad(line);
    }).join('\n') + '\n\n';
  }

  function formatErrors (results) {

    let failCount = results.fail.length;
    let past = (failCount === 1) ? 'was' : 'were';
    let plural = (failCount === 1) ? 'failure' : 'failures';

    let out = '\n' + pad(format.red.bold('Failed Tests:') + ' There ' + past + ' ' + format.red.bold(failCount) + ' ' + plural + '\n');
    out += formatFailedAssertions(results);

    return out;
  }

  function formatTotals (results) {

    if (results.tests.length === 0 &&
        results.asserts.length === 0) {
      return pad(format.red(symbols.cross + ' No tests found'));
    }

    return _.filter([
      pad('total:     ' + results.asserts.length),
      pad(format.green('passing:   ' + results.pass.length)),
      results.fail.length > 0 ? pad(format.red('failing:   ' + results.fail.length)) : undefined,
      pad('duration:  ' + prettyMs(new Date().getTime() - startTime))
    ], _.identity).join('\n');
  }

  function formatFailedAssertions (results) {

    let out = '';

    let groupedAssertions = _.groupBy(results.fail, function (assertion) {
      return assertion.test;
    });

    _.each(groupedAssertions, function (assertions, testNumber) {

      // Wrie failed assertion's test name
      let test = _.find(results.tests, {number: parseInt(testNumber)});
      out += '\n' + pad('  ' + test.name + '\n\n');

      // Write failed assertion
      _.each(assertions, function (assertion) {

        out += pad('    ' + format.red(symbols.cross) + ' ' + format.red(assertion.name)) + '\n';
      });

      out += '\n';
    });

    return out;
  }

  function pad (str) {

    return OUTPUT_PADDING + str;
  }

  return stream;
};
