import _ from 'lodash';

module.exports = function (lines) {

  let leftPadding;

  // Get minimum padding count
  _.each(lines, function (line) {

    let spaceLen = line.match(/^\s+/)[0].length;

    if (leftPadding === undefined || spaceLen < leftPadding) {
      leftPadding = spaceLen;
    }
  });

  // Strip padding at beginning of line
  return _.map(lines, function (line) {

    return line.slice(leftPadding);
  });
}