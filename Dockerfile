ARG WEB_SDK_CONTAINER=rockstat/web-sdk:ng
ARG BASE_CONTAINER=rockstat/band-base-ts:ng

FROM $WEB_SDK_CONTAINER as web-sdk-build

FROM $BASE_CONTAINER

LABEL band.service.version="3.7.1"
LABEL band.service.title="Front"
LABEL band.service.def_position="3x0"
LABEL caddy.targetport="8080"


ENV PORT 8080

WORKDIR /app

COPY package.json .
COPY package-lock.json .

COPY --from=web-sdk-build /usr/share/web-sdk /web-sdk
RUN cd /web-sdk && yarn install --production && yarn link

RUN npm install

RUN yarn link @rockstat/rock-me-ts
RUN yarn link @rockstat/web_sdk
# RUN ln -nsf ../dist ./node_modules/@app

COPY . .
RUN yarn build

EXPOSE 8080
ENV NODE_ENV production
ENV REDIS_DSN redis://redis:6379
ENV LOG_LEVEL debug

# CMD [ "yarn", "start:prod"]

ENV TS_NODE_BASEURL "./dist"
CMD ["node", "-r", "tsconfig-paths/register", "-r", "source-map-support/register", "./dist/start.js"]
