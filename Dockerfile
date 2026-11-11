ARG BASE_CONTAINER=rockstat/band-base-ts:ng

FROM $BASE_CONTAINER

ENV PORT 8080
ENV LOG_LEVEL debug

WORKDIR /app/front

ARG NPM_CONFIG_REGISTRY_ARG=https://registry.npmjs.org
ENV NPM_CONFIG_REGISTRY=$NPM_CONFIG_REGISTRY_ARG   

COPY package.json .
# COPY package-lock.json .

# @rockstat/web_sdk is a git dependency (github:rockstat/web-sdk) — npm needs git
# to resolve the semver range and build it via the package's `prepare` script
RUN command -v git >/dev/null || (apk add --no-cache git 2>/dev/null || (apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*))
RUN npm i --loglevel http && npm cache clean --force
RUN cp -r /usr/src/rockme /app/rockmets

COPY . .

RUN npm run build

EXPOSE 8080
ENV NODE_ENV production
ENV REDIS_DSN redis://redis:6379

CMD ["npm", "run", "start"]
# CMD ["node", "-r", "source-map-support/register", "./dist/start.js"]
