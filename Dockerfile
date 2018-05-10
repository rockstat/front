FROM node:9

# Env vars
ENV TZ UTC
ENV NODE_ENV production

# RUN mkdir -p /app
WORKDIR /app

COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/

RUN yarn install --production
RUN yarn global add pino

COPY . .
# RUN ln -sr ../dist ./node_modules/@app
RUN ln -nsf ../dist ./node_modules/@app

# Downloading latest JSLib
ARG JSLIB_VERSION=master
ENV JSLIB_URL https://raw.githubusercontent.com/rockstat/alcojs/$JSLIB_VERSION/dist/lib.js
RUN curl $JSLIB_URL > clientlib/lib.js

EXPOSE 8080

CMD [ "node", "dist/start.js" ]
