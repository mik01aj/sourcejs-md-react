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
            '<pre>' + err.stack + '</pre>' + // TODO: don't display frames after tryAndHandleError
            '</div>'
        );
    }
}

function renderComponentServerSide(initJsCode, componentJsCode) {
    return tryAndHandleError('JSX EXAMPLE EVAL', function () {
        var component = eval(initJsCode + ';' + componentJsCode); // jshint ignore:line
        return React.renderToString(component);
    });
}

var serverInitJsCode = '';
exports.processServerInit = function (initJsxCode) {
    return tryAndHandleError('SERVER INIT JSX PARSE', function () {
        serverInitJsCode = jstransform.transform(initJsxCode, {react: true}).code;
        //return '<code class="src-js">' + escapeHtml(serverInitJsCode) + '</code>';
        return '';
    });
};

var clientInitJsCode = '';
exports.processClientInit = function (initJsxCode) {
    return tryAndHandleError('CLIENT INIT JSX PARSE', function () {
        initJsxCode = '(function (){' + initJsxCode + '})();'; // Wrapping the function to avoid parse errors
        clientInitJsCode = jstransform.transform(initJsxCode, {react: true}).code;
        //return '<code class="src-js">' + escapeHtml(clientInitJsCode) + '</code>';
        return '';
    });
};

exports.processExample = function (componentJsxCode) {
    return tryAndHandleError('EXAMPLE JSX PARSE', function () {
        var uniqueId = _.uniqueId('react-example-');
        var componentJsCode = jstransform.transform(componentJsxCode, {react: true}).code;
        var renderedHtml = renderComponentServerSide(serverInitJsCode, componentJsCode);
        var clientSideRenderingCode = clientInitJsCode
            .replace('COMPONENT', '(' + componentJsCode + ')')
            .replace('ELEMENT', '$("#' + uniqueId + '")[0]');
        return (
            '\n\n' +
            '<code class="src-html source_visible">' + escapeHtml(componentJsxCode) + '</code>' +
            // '<code class="src-js">' + escapeHtml(componentJsCode) + '</code>' +
            // '<code class="src-js">' + escapeHtml(clientSideRenderingCode) + '</code>' +

            // Client-side rendering script
            '<div class="source_example" id="' + uniqueId + '"></div>' +
            '<script>$(function () {' + clientSideRenderingCode + '});</script>' +

            // Server-side rendered HTML
            '<div class="source_example">' + renderedHtml + '</div>' +
            '\n\n'
        );
    });
};
