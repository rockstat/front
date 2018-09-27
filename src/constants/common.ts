import { epglue, epchild } from '@app/helpers';

// === ENVs
export const ENV_DEV = 'dev';
export const ENV_PROD = 'prod';
export const ENV_STAGE = 'stage';

// === RPC services

export const SERVICE_DIRECTOR = 'director';
export const SERVICE_FRONTIER = 'front';
export const SERVICE_TRACK = 'track';
export const SERVICE_PIXEL = 'pixel';
export const SERVICE_REDIR = 'redir';


export const BROADCAST = 'broadcast';
export const ENRICH = 'enrich';
export const OTHER = 'other';
export const EMPTY = '';


// === RPC methods

export const RPC_IAMALIVE = '__iamalive';

// === TYPES

export const STRING = 'string';


// === INPUT CHANNELS
export const CHANNEL_WEBSOCK = 'ws';
export const CHANNEL_HTTP = 'http';
export const CHANNEL_STATIC = 'static-request';
export const CHANNEL_HTTP_WEBHOOK = 'wh';
export const CHANNEL_HTTP_PIXEL = 'pixel';
export const CHANNEL_HTTP_REDIR = 'redir';
// unknown
export const CHANNEL_NONE = 'none';
// common
export const CHANNEL_GENERIC = 'gen';
// channel for web-sdk
export const CHANNEL_HTTP_TRACK = 'track';


// === CATEGORIES
export const INCOMING = 'in';
export const OUTGOING = 'out';
export const COMMAND = 'cmd';

// === KEYS
export const KEY_NONE = 'none';
export const KEY_BROADCAST = 'broadcast';
export const KEY_HELLO = 'hello';
export const KEY_ECHO = 'echo';

// === CHANNELS+DIRECTIONS
// ws
export const IN_WEBSOCK = epglue(INCOMING, CHANNEL_WEBSOCK);
export const OUT_WEBSOCK = epglue(OUTGOING, CHANNEL_WEBSOCK);
export const CMD_WEBSOCK = epglue(COMMAND, CHANNEL_WEBSOCK);

export const IN_GENERIC = epglue(INCOMING, CHANNEL_GENERIC);

export const IN_WEBHOOK = epglue(INCOMING, CHANNEL_HTTP_WEBHOOK);
export const IN_PIXEL = epglue(INCOMING, CHANNEL_HTTP_PIXEL);
export const IN_TRACK = epglue(INCOMING, CHANNEL_HTTP_TRACK);
export const IN_REDIR = epglue(INCOMING, CHANNEL_HTTP_REDIR);

// base http
export const PATH_HTTP_TEAPOT = epglue(CHANNEL_HTTP, '418');
export const PATH_HTTP_404 = epglue(CHANNEL_HTTP, '404');
export const PATH_HTTP_OPTS = epglue(CHANNEL_HTTP, 'options');

// === COMMANDS
export const IN_WEBSOCK_HELLO = epglue(IN_WEBSOCK, KEY_HELLO);
export const OUT_WEBSOCK_BROADCAST = epglue(OUT_WEBSOCK, KEY_BROADCAST);
export const CMD_WEBSOCK_ADD_GROUP = epglue(CMD_WEBSOCK, 'groupadd');
