FROM node:10-alpine

ENV TZ UTC
ENV PORT 8080
ENV LOG_LEVEL warn
ENV LIB_URL https://cdn.rstat.org/dist/dev/lib-latest.js

RUN apk add python --no-cache make build-base gcc git curl

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install \
  && yarn cache clean

COPY . .
RUN ln -nsf ../dist ./node_modules/@app \
  && yarn build

# For container build
RUN yarn build
RUN curl -s $LIB_URL > web-sdk-dist/lib.js

ENV NODE_ENV production
EXPOSE 8080

CMD [ "yarn", "start:prod"]
