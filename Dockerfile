FROM node:9

# Env vars
ENV TZ UTC
ENV PORT 8080
ENV LOG_LEVEL warn
# RUN mkdir -p /app
WORKDIR /app

# Cachebuster
ARG RELEASE=master
# ENV NODE_ENV production

COPY package.json .
COPY yarn.lock .

RUN yarn install
# RUN yarn install --production
RUN yarn global add pino && yarn cache clean
COPY . .
RUN ln -nsf ../dist ./node_modules/@app

# For container build
RUN yarn build
ENV NODE_ENV production

# Downloading latest JSLib
# ARG LIB_VERSION=HEAD
# ENV LIB_URL https://raw.githubusercontent.com/rockstat/jslib/$LIB_VERSION/dist/lib.js
ENV LIB_URL https://cdn.rstat.org/dist/dev/lib-latest.js
RUN curl -s $LIB_URL > web-sdk-dist/lib.js

EXPOSE 8080

CMD [ "yarn", "start:prod"]
