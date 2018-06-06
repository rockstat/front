FROM node:9

# Env vars
ENV TZ UTC
ENV NODE_ENV production

# RUN mkdir -p /app
WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --production
RUN yarn global add pino

COPY . .
RUN ln -nsf ../dist ./node_modules/@app

# Downloading latest JSLib
ARG LIB_VERSION=HEAD
ENV LIB_URL https://raw.githubusercontent.com/rockstat/jslib/$LIB_VERSION/dist/lib.js
RUN curl $LIB_URL > clientlib/lib.js

EXPOSE 8080

CMD [ "node", "dist/start.js" ]
