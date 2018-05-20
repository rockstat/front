"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("@app/helpers");
// === ENVs
exports.ENV_DEV = 'dev';
exports.ENV_PROD = 'prod';
exports.ENV_STAGE = 'stage';
// === RPC services
exports.SERVICE_BAND = 'band';
exports.SERVICE_KERNEL = 'kernel';
// === RPC methods
exports.CALL_IAMALIVE = '__iamalive';
// === TYPES
exports.STRING = 'string';
// === Data channels
exports.CHANNEL_NONE = 'none';
exports.CHANNEL_HTTP = 'http';
exports.CHANNEL_WEBSOCK = 'ws';
exports.CHANNEL_WEBHOOK = 'webhook';
exports.CHANNEL_PIXEL = 'pixel';
exports.CHANNEL_TRACK = 'track';
exports.CHANNEL_REDIR = 'redir';
exports.CHANNEL_CUSTOM = 'custom';
exports.CHANNEL_INDEPENDENT = 'indep';
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
exports.IN_CUSTOM = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_CUSTOM);
exports.IN_INDEP = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_INDEPENDENT);
exports.IN_WEBHOOK = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_WEBHOOK);
exports.IN_PIXEL = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_PIXEL);
exports.IN_TRACK = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_TRACK);
exports.IN_REDIR = helpers_1.epglue(exports.INCOMING, exports.CHANNEL_REDIR);
// base http
exports.PATH_HTTP_418 = helpers_1.epglue(exports.CHANNEL_HTTP, '418');
exports.PATH_HTTP_404 = helpers_1.epglue(exports.CHANNEL_HTTP, '404');
exports.PATH_HTTP_OPTS = helpers_1.epglue(exports.CHANNEL_HTTP, 'options');
exports.PATH_HTTP_LIBJS = helpers_1.epglue(exports.CHANNEL_HTTP, 'libjs');
// === COMMANDS
exports.IN_WEBSOCK_HELLO = helpers_1.epglue(exports.IN_WEBSOCK, exports.KEY_HELLO);
exports.OUT_WEBSOCK_BROADCAST = helpers_1.epglue(exports.OUT_WEBSOCK, exports.KEY_BROADCAST);
exports.CMD_WEBSOCK_ADD_GROUP = helpers_1.epglue(exports.CMD_WEBSOCK, 'groupadd');
