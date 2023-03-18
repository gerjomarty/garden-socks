import dns from "dns";
import http from "http";
import net from "net";
import socks5 from "simple-socks";

const ALLOWED_DNS = process.env.ALLOWED_DNS;
const HOST = process.env.HOST;
const PROXY_PORT = parseInt(process.env.PROXY_PORT);
const PAC_SERVER_PORT = parseInt(process.env.PAC_SERVER_PORT);

const socksServer = socks5.createServer({
  connectionFilter: function(destination, origin, callback) {
    if (net.isIP(destination.address)) {
      dns.reverse(destination.address, function(err, hostnames) {
        if (!hostnames || !hostnames.length) {
          console.log("Denying connection from %s:%d to %s:%d (no DNS available)",
            origin.address, origin.port, destination.address, destination.port);

          return callback(new Error("Connection denied"));
        }

        if (hostnames[0] === ALLOWED_DNS) {
          return callback();
        } else {
          console.log("Denying connection from %s:%d to %s:%d (DNS: %s)",
            origin.address, origin.port, destination.address, destination.port, hostnames[0]);

          return callback(new Error("Connection denied"));
        }
      });
    } else {
      if (destination.address === ALLOWED_DNS) {
        return callback();
      } else {
        console.log("Denying connection from %s:%d to %s:%d",
            origin.address, origin.port, destination.address, destination.port);

        return callback(new Error("Connection denied"));
      }
    }
  }
});

socksServer.listen(PROXY_PORT);

socksServer.on("handshake", function(socket) {
	console.log("New connection from %s:%d", socket.remoteAddress, socket.remotePort);
});

// When a reqest arrives for a remote destination
socksServer.on("proxyConnect", function(info, destination) {
	console.log("Connected to %s:%d", info.address, info.port);
});

socksServer.on("proxyError", function(error) {
	console.error("Error connecting to remote server");
	console.error(error);
});

socksServer.on("proxyEnd", function(response, args) {
	console.log("Socket closed with code %d", response);
	console.log(args);
});

const pacConfig = `function FindProxyForURL(url, host) {
  if (dnsDomainIs(host, "${ALLOWED_DNS}") || dnsDomainIs(host, ".${ALLOWED_DNS}")) {
    return "SOCKS ${HOST}:${PROXY_PORT}; DIRECT";
  } else {
    return "DIRECT";
  }
}`;

const pacServer = http.createServer(function(request, response) {
  console.log("New connection to PAC server");

  response.writeHead(200, { "Content-Type": "application/x-ns-proxy-autoconfig" });
  response.end(pacConfig);
});

pacServer.listen(PAC_SERVER_PORT);
