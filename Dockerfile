FROM node:alpine as build

WORKDIR /build/src

COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build

RUN mkdir -p /build/out
RUN cp -r docs/.vuepress/dist/* /build/out/

FROM nginx:latest as runtime

COPY --from=build /build/out /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
