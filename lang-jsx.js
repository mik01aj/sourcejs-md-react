'use strict';

var jstransform = require('node-jsx/node_modules/jstransform/simple');
var transformSettings = {react: true, es6: true}; // TODO make this configurable

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

function renderComponentServerSide(initJsCode, componentInitJsCode, componentJsCode) {
    return tryAndHandleError('JSX EXAMPLE EVAL', function () {
        var _require = require;
        var component = (function () {
            var require = _require.main.require.bind(_require.main); // jshint ignore:line
            return eval(initJsCode + ';' + componentInitJsCode + ';' + componentJsCode); // jshint ignore:line
        })();
        return React.renderToString(component);
    });
}

var serverInitJsCode = '';
exports.processServerInit = function (initJsxCode) {
    return tryAndHandleError('SERVER INIT JSX PARSE', function () {
        serverInitJsCode = jstransform.transform(initJsxCode, transformSettings).code;
        //return '<code class="src-js">' + escapeHtml(serverInitJsCode) + '</code>';
        return '';
    });
};

var clientRenderJsCode = '';
exports.processClientInit = function (initJsxCode) {
    return tryAndHandleError('CLIENT INIT JSX PARSE', function () {
        initJsxCode = '(function (){' + initJsxCode + '})();'; // Wrapping the function to avoid parse errors
        clientRenderJsCode = jstransform.transform(initJsxCode, transformSettings).code;
        //return '<code class="src-js">' + escapeHtml(clientRenderJsCode) + '</code>';
        return '';
    });
};

var componentInitJsCode = '';
exports.processComponentInit = function (initJsxCode) {
    return tryAndHandleError('COMPONENT INIT JSX PARSE', function () {
        componentInitJsCode = jstransform.transform(initJsxCode, transformSettings).code;
        //return '<code class="src-js">' + escapeHtml(componentInitJsCode) + '</code>';
        return '';
    });
};

exports.processExample = function (componentJsxCode) {
    return tryAndHandleError('EXAMPLE JSX PARSE', function () {
        var uniqueId = _.uniqueId('react-example-');
        var componentJsCode = jstransform.transform(componentJsxCode, transformSettings).code;
        var renderedHtml = renderComponentServerSide(serverInitJsCode, componentInitJsCode, componentJsCode);

        // NOTE: we're using eval client side, too, for consistency with the server-side.
        // This way constructs like `var d = {title: 'Hello'}; <MyBox data={ d } />` can work.
        // TODO assert COMPONENT and ELEMENT
        var componentJsCodeWithInit = componentInitJsCode + ';' + componentJsCode;
        var clientSideRenderingCode = clientRenderJsCode
            .replace('COMPONENT', 'eval(' + JSON.stringify(componentJsCodeWithInit) + ')') // TODO check that component doesn't return undefined
            .replace('ELEMENT', '$("#' + uniqueId + '")[0]');

        return (
            '\n\n' +
            '<div class="source_react_jsx" style="display: none">' +
                '<code class="src-js source_visible">' + escapeHtml(componentJsxCode) + '</code>' +
            '</div>' +
            // '<code class="src-js">' + escapeHtml(componentJsCode) + '</code>' +
            // '<code class="src-js">' + escapeHtml(clientSideRenderingCode) + '</code>' +

            // Client-side rendering script
            '<div class="source_example source_react_clientside" id="' + uniqueId + '"></div>' +
            '<script>$(function () {' + clientSideRenderingCode + '});</script>' +

            // Server-side rendered HTML
            '<div class="source_example source_react_serverside" style="display: none">' + renderedHtml + '</div>' +
            '\n\n'
        );
    });
};
