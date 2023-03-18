# Garden SOCKS

One of my favourite websites, one that I use every day, recently was forced to start walling off content available inside the United Kingdom because of "licensing reasons". I know they didn't want to take this step and I fully understand the reasoning. However, this felt like totally fair game for a proxy solution, which is the aim of this project.

We set up a simple SOCKS proxy using the [simple-socks](https://github.com/brozeph/simple-socks) module, only allowing proxy requests for a single website. On another port, it also serves up a [Proxy Auto-Configuration (PAC) file](https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file), which directs requests for the same single website to the proxy, and all others directly.

By default, the SOCKS proxy server runs on port 8080, and the PAC server runs on port 8081.

The code itself attempts zero authentication or authorisation, instead keeping everything internal and letting [Tailscale](https://tailscale.com/) handle all of that instead. Any system running Tailscale and authorised with your credentials will be able to reach the proxy server. Tailscale will provide an IP address or hostname for the server that can be used to connect to it.

Finally, the whole thing is packaged to be easily deployable using [Fly.io](https://fly.io). For low usage, you can even utilise their free tier to do it at no cost.

Note that this is not intended to be a robust, privacy-preserving solution. If the proxy server goes down for any reason, your requests will instead go directly to your chosen site unproxied. Do not rely on this if you need to avoid direct connection with your chosen site.

# Instructions
## Deployment
1. Copy `fly.toml.example` to `fly.toml`
   - Replace `example.com` with the domain you want to proxy
1. (If you haven't yet set up Fly.io, have a look at their [Hands-on docs](https://fly.io/docs/hands-on), up to and including signing in)
1. Run `flyctl launch --copy-config --no-deploy`
   - This will prompt you to select an app name, you can choose your own or have one generated, but it must be unique
   - It will then prompt you for a region to deploy to
1. (If you haven't yet set up Tailscale, have a look at their [quickstart guide](https://tailscale.com/kb/1017/install/))
1. Follow [Step 1 of this Tailscale article](https://tailscale.com/kb/1132/flydotio/) to generate an ephemeral key for the app and set it as a Fly.io secret using `flyctl secrets set`, as described
1. Things should now be ready for deploy! Run `flyctl deploy`
   - This should build the `Dockerfile` remotely, then deploy it to your chosen region on Fly.io.
   - Logs should be available from the monitoring URL provided
1. (I wanted to make sure this only ever ran on a single server, CPU, and region, so I also ran `flyctl scale count 1 --max-per-region=1`)

## Using the proxy
1. You'll first want to find the IP address or hostname that the proxy is running on and the PAC file is being served from. Tailscale will provide this for you
    - The Tailscale app should provide a list of network devices and their Tailscale IP addresses - that's what we want here
    - Running `tailscale ip -4 <APP_NAME>`, replacing `<APP_NAME>` with the name of your deployed application, should also provide this
    - You can also use Tailscale's [MagicDNS](https://tailscale.com/kb/1081/magicdns/) to use a hostname rather than an IP address
1. Your proxy configuration server is now `http://<IP_ADDRESS>:8081`, replacing `<IP_ADDRESS>` with the address you found in the previous step
1. Set your client device to use this proxy configuration URL
    - macOS: Instructions are in the [macOS User Guide](https://support.apple.com/en-gb/guide/mac-help/mchlp25912/mac)
    - Windows: Instructions are on [Microsoft's Support site](https://support.microsoft.com/en-us/windows/use-a-proxy-server-in-windows-03096c53-0554-4ffe-b6ab-8b1deee8dae1). Follow steps under "To set up a proxy server using a setup script", and use the server address as the script address
    - iOS: Press (i) button beside your chosen Wi-Fi network, press "Configure Proxy", choose "Automatic", and insert the server address in the URL field
    - Android: Edit your chosen Wi-Fi network, under "Advanced options" for the "Proxy" option, select "Proxy Auto-Config" and enter the server address in the PAC URL field
1. Visits to your chosen site should now go through the proxy server, while all others requests happen as normal!