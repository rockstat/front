ARG WEB_SDK_CONTAINER=rockstat/web-sdk:ng
ARG BASE_CONTAINER=rockstat/band-base-ts:ng

FROM $WEB_SDK_CONTAINER as web-sdk-build

FROM $BASE_CONTAINER

ENV PORT 8080
ENV LOG_LEVEL debug

WORKDIR /app
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc

COPY package.json .
COPY package-lock.json .

# COPY --from=web-sdk-build /usr/share/web-sdk /web-sdk
# RUN cd /web-sdk && yarn install --production && yarn link

COPY .npmrc .

COPY --from=web-sdk-build /usr/share/web-sdk ./web_sdk
RUN cd ./web_sdk && npm link  --loglevel http
RUN npm link @rockstat/rock-me-ts --save --loglevel http 
RUN npm link @rockstat/web_sdk --save --loglevel http 

RUN npm ci  --loglevel http && npm cache clean --force  --loglevel http
RUN rm -f .npmrc


# RUN yarn link @rockstat/rock-me-ts
# RUN npm link @rockstat/web_sdk
# COPY --from=builder /build /usr/share/web-sdk


# RUN yarn link @rockstat/web_sdk
# RUN ln -nsf ../dist ./node_modules/@app

COPY . .
RUN rm .npmrc

RUN npm run build  --loglevel http

EXPOSE 8080
ENV NODE_ENV production
ENV REDIS_DSN redis://redis:6379


# CMD [ "yarn", "start:prod"]

# ENV TS_NODE_BASEURL "./dist"
# CMD ["npm", "run", "start"]
# CMD ["node", "-r", "tsconfig-paths/register", "-r", "source-map-support/register", "./dist/start.js"]
CMD ["node", "-r", "source-map-support/register", "./dist/start.js"]
