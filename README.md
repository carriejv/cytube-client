#cytube-client

[![npm version](https://img.shields.io/npm/v/cytube-client.svg)](https://www.npmjs.com/package/cytube-client) [![Build Status](https://img.shields.io/travis/carriejv/cytube-client.svg)](https://travis-ci.org/carriejv/cytube-client) [![dependencies](https://img.shields.io/david/carriejv/cytube-client.svg)](https://david-dm.org/carriejv/cytube-client)  [![devDependencies](https://img.shields.io/david/dev/carriejv/cytube-client.svg)](https://david-dm.org/carriejv/cytube-client#info=devDependencies)


A simple [Promise-based](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), non-blocking [socket.io client](https://github.com/socketio/socket.io-client) for retrieving information from [cytu.be](https://github.com/calzoneman/sync) servers with NodeJS.

Designed to work with [sync](https://github.com/calzoneman/sync) `3.0+`.

Tested with Node `8.9.4+`.

##Installation

`npm install cytube-client`

or

`yarn add cytube-client`

##Usage

```javascript
var cytube = require('cytube-client');
cytube.connect('channel').then( (connection) => {

    connection.getCurrentMedia().then( (result) => {
        console.log(result);
    }).catch( (error) => {
        // Handle timeout or disconnect.
    });

    connection.on('changeMedia', (data) => {
        console.log(data);
    });

    // Later ...

    connection.close();

}).catch( (error) => {
    // Error handling.
});
```

Sync allows for joining channels that do not already exist. The server will begin sending events if they are created, but will not prevent the connection.

Please ensure your channel names are accurate if requests are timing out.

##Connection Options
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

##Retrieving Channel Information

Cytube-client provides some basic Promise-based functions for retrieving channel state information, since sync no longer has a built-in REST API.

```javascript
connection.getCurrentMedia();   // Resolves to a JSON representation of the currently playing media.
connection.getPlaylist();       // Resolves to a JSON array of queued media.
connection.getUserlist();       // Resolves to a JSON array of users connected to the channel.
```

##Event Listeners

The [socket.io client](https://github.com/socketio/socket.io-client) is exposed at `connection.socket` and can be used to attach event listeners. See the socket.io-client documentation for more information.

```javascript
connection.on('event', callback);   // Shorthand for connection.socket.on
connection.once('event', callback); // Shorthand for connection.socket.once
connection.off('event');            // Shorthand for connection.socket.off
```

For a full list of emitted events, see the [sync](https://github.com/calzoneman/sync) documentation. Basic events include:

```javascript
changeMedia     // Fired once when listener is attached and on subsequent media changes.
queue           // Fired when a new media item is queued.
chatMsg         // Fired on new chat message.
addUser         // Fired on a user joining the channel
userLeave       // Fired on a user leaving the channel.

```