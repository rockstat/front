# About

Front service of Rockstat

## About Rockstat

Is an open source platform for a web and product analytics. 
It consists of a set of components: JavaScript tracking client for web applications; 
server-side data collector; services for geo-coding and detecting client device type; 
a new server deployment system.
[Read more](https://rockstat.ru/about)

## About Rockstat Frontier

Frontier service is a entrypoint for all external data.

Look at the scheme

![Rockstat sheme](https://rock.st/static/images/docs/schemas/request-lifecycle.svg)

## Envs and defaults

    REDIS_URL=redis://127.0.0.1:6379
    STATSD_HOST=127.0.0.1

    HOST=0.0.0.0
    PORT=8080
    PORT_WS=8082
    PORT_WSS=8083

    LOG_LEVEL=info

## Building

Source maps options

    "sourceMap": true,

or

    "inlineSourceMap": true,

## License

[LICENSE](LICENSE)
