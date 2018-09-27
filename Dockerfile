FROM rockstat/band-base-ts:latest

LABEL band.service.version="3.2.0"
LABEL band.service.title="Front"
LABEL band.service.def_position="3x0"

ENV PORT 8080
ENV LIB_URL https://cdn.rstat.org/dist/dev/lib-latest.js

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn link "@rockstat/rock-me-ts" \
  && yarn install \
  && yarn cache clean

COPY . .
ENV NODE_ENV production

EXPOSE 8080

RUN ln -nsf ../dist ./node_modules/@app \
  && yarn build \
  && curl -s $LIB_URL > static/lib.js

CMD [ "yarn", "start:prod"]
