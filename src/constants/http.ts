
export const CONTENT_TYPE_HTML = 'text/html';
export const CONTENT_TYPE_PLAIN = 'text/plain';
export const CONTENT_TYPE_GIF = 'image/gif';
export const CONTENT_TYPE_URLENCODED = 'application/x-www-form-urlencoded';
export const CONTENT_TYPE_JSON = 'application/json; charset=utf-8';
export const CONTENT_TYPE_JS = 'text/javascript';

export const HContentType = 'Content-Type';
export const HLocation = 'Location';
export const HResponseTime = 'X-Response-Time';
export const HMyName = 'X-My-Name';

export const ResponseGif = 'GIF';
export const ResponseRedir = 'REDIR';
export const ResponseJson = 'JSON';
export const ResponseAuto = 'AUTO';

export const STATUS_OK = 200;
export const STATUS_OK_NO_CONTENT = 204;
export const STATUS_BAD_REQUEST = 400;
export const STATUS_NOT_FOUND = 404;
export const STATUS_TEAPOT = 418;
export const STATUS_INT_ERROR = 500;
export const STATUS_TEMP_REDIR = 302;
export const STATUS_PERSIST_REDIR = 301;
export const STATUS_SEE_OTHERS_REDIR = 303;
export const STATUS_UNKNOWN = 'Unknown Status';

export const STATUS_DESCRIPTIONS: { [k: string]: string } = {
  STATUS_OK: 'Ok',
  STATUS_OK_NO_CONTENT: 'No Content',
  STATUS_BAD_REQUEST: 'Bad Request',
  STATUS_NOT_FOUND: 'Not Found',
  STATUS_TEAPOT: "I'm a teapot",
  STATUS_INT_ERROR: 'Internal Error',
  STATUS_TEMP_REDIR: 'Temporary Redirect',
  STATUS_PERSIST_REDIR: 'Temporary Redirect',
  STATUS_SEE_OTHERS_REDIR: 'See Others'
}

export const METHOD_OPTIONS = 'OPTIONS';
export const METHOD_POST = 'POST';
export const METHOD_GET = 'GET';

export const CONTENT_BAD_REQUEST = '{"error":"Bad request"}';

// For testing purpose
export const AbsentRedir = 'https://alcolytics.ru?utm_source=AbsenRedir';
