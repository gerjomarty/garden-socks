#!/bin/sh

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

./tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
./tailscale up --authkey=${TAILSCALE_AUTHKEY} --hostname=${FLY_APP_NAME}
export HOST="$(./tailscale ip -4)"

node index.js
