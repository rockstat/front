# About

Kernel of Rockstat

## About Rockstat

Is an open source platform for a web and product analytics. 
It consists of a set of components: JavaScript tracking client for web applications; 
server-side data collector; services for geo-coding and detecting client device type; 
a new server deployment system.
[Read more](https://rockstat.ru/about)

![Rockstat sheme](https://rockstat.ru/media/rockstat_v3_arch.png?3)

## Envs and defaults

    REDIS_URL=redis://127.0.0.1:6379
    STATSD_HOST=127.0.0.1

    HOST=0.0.0.0
    PORT=8080
    PORT_WS=8082
    PORT_WSS=8083

    LOG_LEVEL=info


## modules resolution
    "_moduleAliases": {
      "@app": "src"
    }
    https://www.npmjs.com/package/tsconfig-paths

## License

[LICENSE](LICENSE)
