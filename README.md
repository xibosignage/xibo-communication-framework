# Xibo Communication Framework

A library written for web based players that will contain communication between the player and the CMS.

## Modules

* XMR - Basic implementation
* XMDS - To follow

### XMR

Start using XMR from this library by installing it through npm to our web based player (e.g. ChromeOS Player)

```shell
npm install @xibosignage/xibo-communication-framework
```

Once the package is installed, we can import the XMR object from where we want to initialize it in our player.

```typescript
import {Xmr} from '@xibosignage/xibo-communication-framework';
```

We can then create an instance of XMR object to manage the XMR state.

```typescript
let xmr = new Xmr(config.xmrChannel || ‘unknown’);

// Initialize XMR
await xmr.init();
```

`config.xmrChannel` is a randomly generated string for the XMR channel name.

Finally, we can start XMR when our display has been registered through the call on the XMDS register display. In the case of the ChromeOS player, we are doing the following after successful display registration.

Connected to a local development CMS the value for `xmrWebSocketAddress` would be [ws://localhost/xmr
](ws://localhost/xmr)
```typescript
// Web Sockets are only supported by the CMS if the XMDS version is 7, otherwise ZeroMQ web sockets should be used.
// Use ws not http 
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

// If the CMS has sent an alternative WS address, use that instead.
let xmrWebSocketAddress = config.getSetting(
  'xmrWebSocketAddress',
  cmsUrl.replace(window.location.protocol, protocol) + '/xmr'
);
xmr.start(xmrWebSocketAddress, config.getSetting('xmrCmsKey', 'n/a'));
```