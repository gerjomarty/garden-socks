FROM alpine:latest as tailscale
WORKDIR /usr/src/app
ENV TSFILE=tailscale_1.38.1_amd64.tgz
RUN wget https://pkgs.tailscale.com/stable/${TSFILE} && \
  tar xzf ${TSFILE} --strip-components=1

FROM node:alpine
RUN apk update && apk add ca-certificates iptables ip6tables && rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY --from=tailscale /usr/src/app/tailscaled tailscaled
COPY --from=tailscale /usr/src/app/tailscale tailscale
RUN mkdir -p /var/run/tailscale /var/cache/tailscale /var/lib/tailscale
COPY . ./
RUN npm install
EXPOSE 8080 8081
CMD ["npm", "start"]
