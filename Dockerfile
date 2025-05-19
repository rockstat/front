ARG WEB_SDK_CONTAINER=rockstat/web-sdk:ng
ARG BASE_CONTAINER=rockstat/band-base-ts:ng

FROM $WEB_SDK_CONTAINER as web-sdk-build

FROM $BASE_CONTAINER

ENV PORT 8080
ENV LOG_LEVEL debug

WORKDIR /app/front

ARG NPM_CONFIG_REGISTRY_ARG=https://registry.npmjs.org
ENV NPM_CONFIG_REGISTRY=$NPM_CONFIG_REGISTRY_ARG   

COPY package.json .
# COPY package-lock.json .

RUN npm i --loglevel http && npm cache clean --force
RUN cp -r /usr/src/rockme /app/rockmets
COPY --from=web-sdk-build /usr/share/web-sdk /app/web-sdk

COPY . .

RUN npm run build

EXPOSE 8080
ENV NODE_ENV production
ENV REDIS_DSN redis://redis:6379

CMD ["npm", "run", "start"]
# CMD ["node", "-r", "source-map-support/register", "./dist/start.js"]
