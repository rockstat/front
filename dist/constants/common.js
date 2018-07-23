"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("@app/helpers");
// === ENVs
exports.ENV_DEV = 'dev';
exports.ENV_PROD = 'prod';
exports.ENV_STAGE = 'stage';
// === RPC services
exports.SERVICE_DIRECTOR = 'director';
exports.SERVICE_FRONTIER = 'frontier';
exports.SERVICE_TRACK = 'track';
exports.BROADCAST = 'broadcast';
exports.ENRICH = 'enrich';
exports.OTHER = 'other';
// === RPC methods
exports.RPC_IAMALIVE = '__iamalive';
// === TYPES
exports.STRING = 'string';
// === INPUT CHANNELS
exports.CHANNEL_WEBSOCK = 'ws';
exports.CHANNEL_HTTP = 'http';
exports.CHANNEL_HTTP_WEBHOOK = 'wh';
exports.CHANNEL_HTTP_PIXEL = 'pixel';
exports.CHANNEL_HTTP_REDIR = 'redir';
// unknown
exports.CHANNEL_NONE = 'none';
// common
exports.CHANNEL_GENERIC = 'gen';
// channel for web-sdk
exports.CHANNEL_HTTP_TRACK = 'track';
// === CATEGORIES
exports.INCOMING = 'in';
exports.OUTGOING = 'out';
exports.COMMAND = 'cmd';
// === KEYS
exports.KEY_NONE = 'none';
exports.KEY_BROADCAST = 'broadcast';
exports.KEY_HELLO = 'hello';
exports.KEY_ECHO = 'echo';
// === CHANNELS+DIRECTIONS
// ws
exports.IN_WEBSOCK = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_WEBSOCK);
exports.OUT_WEBSOCK = helpers_1.epglue(exports.OUTGOING, exports.CHANNEL_WEBSOCK);
exports.CMD_WEBSOCK = helpers_1.epglue(exports.COMMAND, exports.CHANNEL_WEBSOCK);
exports.IN_GENERIC = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_GENERIC);
exports.IN_WEBHOOK = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_HTTP_WEBHOOK);
exports.IN_PIXEL = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_HTTP_PIXEL);
exports.IN_TRACK = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_HTTP_TRACK);
exports.IN_REDIR = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_HTTP_REDIR);
// base http
exports.PATH_HTTP_TEAPOT = helpers_1.epglue(exports.CHANNEL_HTTP, '418');
exports.PATH_HTTP_404 = helpers_1.epglue(exports.CHANNEL_HTTP, '404');
exports.PATH_HTTP_OPTS = helpers_1.epglue(exports.CHANNEL_HTTP, 'options');
exports.PATH_HTTP_LIBJS = helpers_1.epglue(exports.CHANNEL_HTTP, 'libjs');
// === COMMANDS
exports.IN_WEBSOCK_HELLO = helpers_1.epglue(exports.IN_WEBSOCK, exports.KEY_HELLO);
exports.OUT_WEBSOCK_BROADCAST = helpers_1.epglue(exports.OUT_WEBSOCK, exports.KEY_BROADCAST);
exports.CMD_WEBSOCK_ADD_GROUP = helpers_1.epglue(exports.CMD_WEBSOCK, 'groupadd');
//# sourceMappingURL=common.js.map