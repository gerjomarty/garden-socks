FROM node:alpine
RUN apk update && apk add ca-certificates iptables ip6tables && rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY --from=tailscale/tailscale:stable /usr/local/bin/tailscaled tailscaled
COPY --from=tailscale/tailscale:stable /usr/local/bin/tailscale tailscale
RUN mkdir -p /var/run/tailscale /var/cache/tailscale /var/lib/tailscale
COPY . ./
RUN npm install
EXPOSE 8080 8081
CMD ["npm", "start"]
