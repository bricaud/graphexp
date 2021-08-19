FROM nginx:stable

LABEL maintainer="armand.leopold@outlook.com"

WORKDIR /usr/share/nginx/html
COPY . /usr/share/nginx/html

RUN sed -i 's/const HOST = "localhost"/const HOST = self.location.hostname/' scripts/graphConf.js