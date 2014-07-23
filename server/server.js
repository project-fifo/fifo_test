// CONFIG
var Config = global.Config = require('./config/config.js').config,
    isTestEnviron = ((module.parent !== null) && (module.parent.parent));

if (isTestEnviron) {
    cluster = {
        worker: {
            id: -1
        }
    };
}
var workerIdPrefix = '[ cluster: worker ' + cluster.worker.id + ' ] ';

// DEPENDENCIES
// ============

// Node and App
var express = require('express'),
    http = require('http'),
    net = require('net'),
    ejs = require('ejs'),
    gfs = require('graceful-fs'),
    util = require('util'),
    connect = require('connect'),
    fs = require('fs'),

    // API Middleware
    fifo = require('./middleware/fifoapi'),
    API = require('./API.js'),

    // And collect variables the API needs to work correctly
    ApiMiddlewareVariables = [fifo],

    // Non-API Middleware
    msgpack = require('msgpack'),

    // Express
    port = (process.env.PORT || Config.listenPort),
    server = module.exports = express(),
    cookie = require('cookie'),

    // Setup the server
    serverWrap = http.createServer(server),

    // Sockets
    winston = require('winston');

// Setup the exception logger
winston.handleExceptions(new winston.transports.File({
    filename: 'winston-exceptions.log'
}));

// Let the fifo module know about the activity logger, to save login attempts
var ActivityLog = {
    create: function() {}
};
fifo.setActivityLog(ActivityLog);

// SERVER CONFIGURATION
// ====================

server.configure(function() {

    // add timestamps in front of log messages
    // require('console-stamp')(console, '[HH:mm:ss.l]');
    // express.logger.format('mydate', function() {
    //     var df = require('console-stamp/node_modules/dateformat');
    //     return df(new Date(), 'ddd, d mmm yyyy HH:MM:ss.l Z');
    // });

    // Server Config

    // server.use(express.bodyParser());
    server.use(express.json());
    server.use(express.urlencoded());

    server.use(express.cookieParser());

    // server.use(express.logger({
    //     format: workerIdPrefix + ':remote-addr - :status [:mydate] :method :url - :response-time ms'
    // }));

    server.use(server.router);

});

// API
// ===

API.api(server, ApiMiddlewareVariables);

// print out the worker startup message
setTimeout(function() {
    var blankLine = '                      ',
        workerStr = '[ Worker ' + cluster.worker.id + ' ]',
        padStr = function(inStr, padChar, modSize) {
            if (!modSize) {
                modSize = 0;
            }
            var i, result = '',
                padAmount = blankLine.length - inStr.length + modSize,
                padLeft = Math.floor(padAmount / 2),
                padRight = padAmount - padLeft;
            if (!padChar) {
                padChar = ' ';
            }
            for (i = 0; i < padLeft; i++) {
                result += padChar;
            }
            result += inStr;
            for (i = 0; i < padRight; i++) {
                result += padChar;
            }
            return result;
        },
        consoleMsg = [
            ' ' + padStr('', '_', 2) + '',
            '/\\ ' + padStr('') + '\\',
            '\\_|' + padStr('') + '|',
            '  |' + padStr('Welcome to LuceraHQ!') + '|',
            '  |' + padStr(workerStr) + '|',
            '  |   ' + padStr('', '_', -3) + '|__',
            '   \\_/' + padStr('', '_', -1) + '/',
            ''
        ];
    console.log(consoleMsg.join('\n'));
}, 100);

// Hand the server off to the test environment if detected
module.exports.appServer = serverWrap;
