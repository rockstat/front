# About Alcolytics

Is an open source platform for a web and product analytics. 
It consists of a set of components: JavaScript tracking client for web applications; 
server-side data collector; services for geo-coding and detecting client device type; 
a new server deployment system.
[Read more](https://alco.readme.io/docs)

Платформа для web и продуктовой аналитики с открытым исходным кодом.
Включает в себя JavaScript трекер для сайта; сервис получения, обогащения,
сохранения и стриминга данных; сервисы гео-кодинга и определения типа клиентского устройства;
систему развертывания нового сервера.
[Подробнее](https://alco.readme.io/docs) 

![Alcolytics sheme](https://alcolytics.ru/media/alco-scheme.png)

## About Alco-Handler

Базовые функции:
- Отдача AlcoJS
- Пример различных запросов: 
  - alcojs post, img
  - webhooks
  - webSockets
- Сбор мета-данных входящих запросов
- Отправка в домашние сервисы:
  - ClickHouse uploader
  - Mixpanel exporter
- Отправка во внешние сервисы, с возвратом результата
  - Процессинг ботов
  - Кастомная бизнес-логика

## Envs and defaults

REDIS_URL=redis://127.0.0.1:6379
STATSD_HOST=127.0.0.1

HOST=0.0.0.0
PORT=8080
PORT_WS=8082
PORT_WSS=8083

LOG_LEVEL=info

## License

[LICENSE](LICENSE)
