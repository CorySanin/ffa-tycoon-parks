FROM corysanin/openrct2-cli:latest-alpine AS rct2

FROM node:alpine3.15

WORKDIR /usr/src/ci-check

RUN apk add --no-cache rsync ca-certificates libpng libzip libcurl duktape freetype fontconfig icu sdl2 speexdsp &&  \
 mkdir -p /home/node/.config/OpenRCT2/plugin && \
 ln -sf /usr/src/ci-check/plugin.js /home/node/.config/OpenRCT2/plugin/ && \
 chown -R node:node /home/node/.config/OpenRCT2

COPY --from=rct2 /usr /usr

COPY ci-check .

USER node

CMD [ "node", "index.js" ]
