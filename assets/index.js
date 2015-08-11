/**
 * Sourcejs plugin for React - client-side part
 *
 * @author Mikolaj Dadela
 */
"use strict";

define([
    "jquery",
    "sourceModules/module",
    "sourceModules/innerNavigation",
    "sourceModules/css",
    // "https://s3-eu-central-1.amazonaws.com/react-frontend-cdn.lovelybooks.de/lb-react-frontend-0.2.0.js",
], function ($, module, innerNavigation, css) {

    var moduleCss = new css("/node_modules/sourcejs-md-react/assets/css/react_examples.css");

    // console.log('lb', lb);
    // window.lbReactFrontend = lb;

    console.log('HELLO!');

    function MdReactPlugin() {

        var _this = this;

        this.options.plugins.zzz = $.extend(true, {
            // TODO
        }, this.options.plugins.zzz);

        $(function(){
            _this.init();
        });

    }

    MdReactPlugin.prototype = module.createInstance();
    MdReactPlugin.prototype.constructor = MdReactPlugin;

    MdReactPlugin.prototype.init = function () {
        // TODO: if there are no React components, return and don't add the menu items.
        this.addMenuItems();
    };

    MdReactPlugin.prototype.addMenuItems = function(){

        function toggle(clientOrServer, showOrHide) {
            $('.source_example.source_react_' + clientOrServer + 'side')[showOrHide]();
        }

        innerNavigation.addMenuItemSimple('React rendering:', [
            {
                name: 'client',
                callback: function() {
                    toggle('client', 'show');
                    toggle('server', 'hide');
                }
            },
            {
                name: 'server',
                callback: function() {
                    toggle('client', 'hide');
                    toggle('server', 'show');
                }
            },
            {
                name: 'both',
                callback: function() {
                    toggle('client', 'show');
                    toggle('server', 'show');
                }
            },
        ], this);

        innerNavigation.addMenuItem("Show Components' JSX source",
            function() { $('.source_react_jsx').show(); },
            function() { $('.source_react_jsx').hide(); }
        );
    };

    return new MdReactPlugin();
});
