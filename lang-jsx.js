'use strict';

var jstransform = require('node-jsx/node_modules/jstransform/simple');

require('node-jsx').install({extension: '.jsx', harmony: true});

var React = require('react/addons');
var path = require('path');
var _ = require('lodash');

function clearAllJsxReferencesInRequireCache () {
    _.each(require.cache, function (cacheObj, key) {
        if (path.extname(key) === '.jsx') {
            delete require.cache[key];
        }
    });
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tryAndHandleError(where, callback) {
    try {
        return callback();
    } catch (err) {
        console.error('ERROR IN ' + where, err);

        return (
            '<div class="source_warn">' +
            '<h1>ERROR IN ' + where +  ': ' + err + '</h1>' +
            '<pre>' + err.stack + '</pre>' +
            '</div>'
        );
    }
}

function renderComponent(initJsCode, componentJsCode) {
    return tryAndHandleError('JSX EXAMPLE EVAL', function () {
        var component = eval(initJsCode + ';' + componentJsCode); // jshint ignore:line
        return React.renderToString(component);
    });
}

var initJsCode = '';
exports.processInit = function (initJsxCode) {
    console.log('PROCESSING INIT!', initJsxCode);
    return tryAndHandleError('INIT JSX PARSE', function () {
        initJsCode = jstransform.transform(initJsxCode, {react: true}).code;
        return '<code class="src-js source_visible">' + escapeHtml(initJsCode) + '</code>';
    });
};

exports.processExample = function (jsxCode) {
    console.log('PROCESSING JSX!', jsxCode);
    return tryAndHandleError('EXAMPLE JSX PARSE', function () {
        var uniqueId = _.uniqueId('react-example-');
        var componentJsCode = jstransform.transform(jsxCode, {react: true}).code;
        var renderedHtml = renderComponent(initJsCode, componentJsCode);
        return (
            '\n\n' +
            '<code class="src-html source_visible">' + escapeHtml(jsxCode) + '</code>' +
            '<code class="src-js">' + escapeHtml(componentJsCode) + '</code>' +
            '<div id="' + uniqueId + '"></div>' +
            '<div class="source_example">' + renderedHtml + '</div>' +
            '\n\n'
        );
    });
};
