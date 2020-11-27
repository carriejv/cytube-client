# cytube-client

[![npm version](https://img.shields.io/npm/v/cytube-client.svg)](https://www.npmjs.com/package/cytube-client) [![Build Status](https://img.shields.io/travis/carriejv/cytube-client.svg)](https://travis-ci.org/carriejv/cytube-client) [![dependencies](https://img.shields.io/david/carriejv/cytube-client.svg)](https://david-dm.org/carriejv/cytube-client)  [![devDependencies](https://img.shields.io/david/dev/carriejv/cytube-client.svg)](https://david-dm.org/carriejv/cytube-client#info=devDependencies)


A simple [Promise-based](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), non-blocking [socket.io client](https://github.com/socketio/socket.io-client) for retrieving information from [cytu.be](https://github.com/calzoneman/sync) servers with NodeJS.

Designed to work with [sync](https://github.com/calzoneman/sync) `3.0+`.

Tested with Node `6.16.0+`.

## Installation

`npm install cytube-client`

or

`yarn add cytube-client`

## Usage

##### With Promises

```javascript
var cytube = require('cytube-client');
cytube.connect('channel').then( (client) => {

    client.getCurrentMedia().then( (data) => {
        console.log(data);
    }).catch( (err) => {
        // Handle timeout or disconnect.
    });

    client.on('changeMedia', (data) => {
        console.log(data);
    });

    // Later ...

    client.close();

}).catch( (err) => {
    // Handle client connection errors.
});
```

##### With Callbacks

```javascript
var cytube = require('cytube-client');
cytube.connect('channel', (err, client) => {

    if(err) {
        // Handle client connect errors.
    }

    client.getCurrentMedia((err, data) => {
        if(err) {
            // Handle timeout or disconnect.
        }
        else {
            console.log(data);
        }
    });

    client.on('changeMedia', (data) => {
        console.log(data);
    });

    // Later ...

    client.close();
});
```

Sync allows clients to join channels that do not already exist. The server will begin sending events if they are created, but will not prevent the connection.

Please ensure your channel names are accurate if requests are timing out.

## Connection Options
```javascript
var options = {
    channel: 'channel',                             // This is REQUIRED. Sync will not acknowledge connections without a specified channel.
    password: 'password',                           // If the channel requires a password, it must be provided here.
    secure: true,                                   // If true, retrieves data over SSL from the socket server. Default true.
    reconnect: true,                                // If true, attempts to reconnect indefinitely if disconnected. Default true.
    socketServer: 'https://your.sync.server:3000'   // If set, connects to the specified url instead of searching for a channel on cytu.be.
};

var cytube = require('cytube-client');
cytube.connect(options).then( (connection) => {
    // ...
});
```

## Retrieving Channel Information

Cytube-client provides some basic Promise-based functions for retrieving channel state information, since sync no longer has a built-in REST API.

These functions can also be used with callbacks.

```javascript
client.getCurrentMedia();   // Resolves to a JSON representation of the currently playing media.
client.getPlaylist();       // Resolves to a JSON array of queued media.
client.getUserlist();       // Resolves to a JSON array of users connected to the channel.
```

## Event Listeners

The [socket.io client](https://github.com/socketio/socket.io-client) is exposed at `client.socket` and can be used to attach event listeners. See the socket.io-client documentation for more information.

```javascript
client.on('event', callback);   // Shorthand for client.socket.on
client.once('event', callback); // Shorthand for client.socket.once
client.off('event');            // Shorthand for client.socket.off
```

For a full list of emitted events, see the [sync](https://github.com/calzoneman/sync) documentation. Basic events include:

```javascript
changeMedia     // Fired once when listener is attached and on subsequent media changes.
queue           // Fired when a new media item is queued.
chatMsg         // Fired on new chat message.
addUser         // Fired on a user joining the channel
userLeave       // Fired on a user leaving the channel.
```

## Contributions

Contributions and pull requests are always welcome. Please be sure your code passes all existing tests and linting.

Pull requests with full code coverage are strongly encouraged.

An integration test is provided for testing connections to cytu.be itself. Because cytu.be channels are ephemeral by nature, this test is not run automatically as part of the normal `npm test` suite.

To run the integration test, use `CYTUBE_TEST_CHANNEL="your-channel-here" npm run testIntegration`. You can also set `DEBUG=socket.io*` or `DEBUG=engine,socket.io*` to receive debug output from the websocket when running this test.

## License

[MIT](https://github.com/carriejv/cytube-client/blob/master/LICENSE)