FROM corysanin/openrct2-cli:latest-alpine AS rct2

FROM node:alpine3.21 AS deploy

WORKDIR /usr/src/ci-check

RUN apk add --no-cache rsync ca-certificates libpng libzip libcurl freetype fontconfig icu &&  \
 mkdir -p /home/node/.config/OpenRCT2/plugin /home/node/.config/OpenRCT2/object && \
 ln -sf /usr/src/ci-check/plugin.js /home/node/.config/OpenRCT2/plugin/ && \
 chown -R node:node /home/node/.config/OpenRCT2

COPY --from=rct2 /usr /usr

COPY . .

USER node

CMD [ "node", "index.js" ]
