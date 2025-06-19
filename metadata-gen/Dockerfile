FROM node:alpine3.21 AS base
FROM corysanin/openrct2-cli:latest-alpine AS rct2
FROM base AS install

WORKDIR /usr/src/meta

COPY ./package*json ./

RUN npm install --omit=dev

COPY . .

FROM base AS deploy

WORKDIR /usr/src/meta

RUN apk add --no-cache rsync ca-certificates libpng libzip libcurl freetype fontconfig icu &&  \
 mkdir -p /home/node/.config/OpenRCT2/plugin /home/node/.config/OpenRCT2/object && \
 ln -sf /usr/src/meta/plugin.js /home/node/.config/OpenRCT2/plugin/ && \
 chown -R node:node /home/node/.config/OpenRCT2

COPY --from=rct2 /usr /usr

COPY --from=install /usr/src/meta .

USER node

CMD [ "node", "--experimental-strip-types", "src/index.ts" ]
