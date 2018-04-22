FROM node:9

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/

RUN yarn install --production
RUN yarn global add pino

COPY . /usr/src/app

# Downloading latest alcojs lib
ARG ALCOJS_VERSION=master
ENV ALCOJS_URL https://raw.githubusercontent.com/alcolytics/alcojs/$ALCOJS_VERSION/dist/lib.js
RUN curl $ALCOJS_URL > alcojs/lib.js

# Env vars
ENV TZ UTC
ENV NODE_ENV production

RUN yarn compile

EXPOSE 8080

CMD [ "node", "." ]
