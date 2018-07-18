FROM node:9

# Env vars
ENV TZ UTC
ENV NODE_ENV production
ENV PORT 8080
ENV LOG_LEVEL warn
# RUN mkdir -p /app
WORKDIR /app

#cachebust
ARG RELEASE=master

COPY package.json .
COPY yarn.lock .

RUN yarn install --production
RUN yarn global add pino && yarn cache clean
COPY . .
RUN ln -nsf ../dist ./node_modules/@app

# Downloading latest JSLib
ARG LIB_VERSION=HEAD
#ENV LIB_URL https://raw.githubusercontent.com/rockstat/jslib/$LIB_VERSION/dist/lib.js
ENV LIB_URL https://cdn.rstat.org/dist/dev/lib-latest.js
RUN curl $LIB_URL > web-sdk-dist/lib.js

EXPOSE 8080

CMD [ "node", "dist/start.js" ]
