import { epglue, epchild } from '@app/helpers';

// === ENVs
export const ENV_DEV = 'dev';
export const ENV_PROD = 'prod';
export const ENV_STAGE = 'stage';

// === TYPES

export const STRING = 'string';

// === Data channels
export const CHANNEL_NONE = 'none';
export const CHANNEL_HTTP = 'http';
export const CHANNEL_WEBSOCK = 'ws';
export const CHANNEL_WEBHOOK = 'webhook';
export const CHANNEL_PIXEL = 'pixel';
export const CHANNEL_TRACK = 'track';
export const CHANNEL_REDIR = 'redir';
export const CHANNEL_CUSTOM = 'custom';


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

export const IN_CUSTOM = epglue(INCOMING, CHANNEL_CUSTOM);

export const IN_WEBHOOK = epglue(INCOMING, CHANNEL_WEBHOOK);
export const IN_PIXEL = epglue(INCOMING, CHANNEL_PIXEL);
export const IN_TRACK = epglue(INCOMING, CHANNEL_TRACK);
export const IN_REDIR = epglue(INCOMING, CHANNEL_REDIR);

// base http
export const PATH_HTTP_404 = epglue(CHANNEL_HTTP, '404');
export const PATH_HTTP_OPTS = epglue(CHANNEL_HTTP, 'options');
export const PATH_HTTP_LIBJS = epglue(CHANNEL_HTTP, 'libjs');

// === COMMANDS
export const IN_WEBSOCK_HELLO = epglue(IN_WEBSOCK, KEY_HELLO);
export const OUT_WEBSOCK_BROADCAST = epglue(OUT_WEBSOCK, KEY_BROADCAST);
export const CMD_WEBSOCK_ADD_GROUP = epglue(CMD_WEBSOCK, 'groupadd');

