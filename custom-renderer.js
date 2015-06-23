var renderer = {};

renderer.heading = function (text, level) {
    return '<h' + level + '>Custom: ' + text + '</h' + level + '>';
};


module.exports = renderer;