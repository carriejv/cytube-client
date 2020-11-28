'use strict';

/**
 * Module Dependencies
 */
const io = require('socket.io-client');
const axios = require('axios');

/**
 * Constants
 */
const CONFIG_URL = 'https://cytu.be/socketconfig/%channel.json';
const ERR_PREFIX = 'cytube-client: ';
const DEFAULT_TIMEOUT = 10000;

/**
 * CytubeConnection defines the object returned by a public api call to connect.
 * A CytubeConnection represents a single connection to a socket server, listening to events on a single, immutible channel.
 * @constructor
 * @typedef {Object} CytubeConnection
 * @property {Object} socket - The Socket.io connection.
 * @property {string} socketServer - The url of the socket server.
 * @property {string} channel - The channel on which to listen for events.
 * @property {number} [timeout] - Optional timeout for cytu.be requests in ms. Default 10000 (10s). Set to 0 to disable.
 */
const CytubeConnection = function(socket, socketServer, channel, timeout) {
	this.socket = socket;
	this.socketServer = socketServer;
	this.channel = channel;
	this.timeout = timeout === undefined ? DEFAULT_TIMEOUT : timeout;
};

/**
 * Attaches a listener for an event.
 * @param {string} event - An event id.
 * @param {function} callback - Callback with one argument, containing the response data for the event.
 */
CytubeConnection.prototype.on = function(event, callback) {
	this.socket.on(event, res => {
		callback(res);
	});
};

/**
 * Listens for a single occurance of an event.
 * @param {string} event - An event id.
 * @param {function} callback - Callback with one argument, containing the response data for the event.
 */
CytubeConnection.prototype.once = function(event, callback) {
	this.socket.once(event, res => {
		callback(res);
	});
};

/**
 * Removes a listener for an event.
 * @param {string} event - An event id.
 */
CytubeConnection.prototype.off = function(event) {
	this.socket.off(event);
};

/**
 * Disconnects from the socket server.
 */
CytubeConnection.prototype.close = function() {
	this.socket.close();
};

/**
 * Retrieves information about the currently playing media.
 * @param {function} [callback] - A callback function, accepting an error (if any) and a the retrieved data as parameters. If none is provided, returns a Promise object instead.
 * @return {Promise} - A Promise that resolves to the media data in JSON format.
 */
CytubeConnection.prototype.getCurrentMedia = function(callback) {
	let promise = new Promise((resolve, reject) => {
		var timeout = !this.timeout ? undefined : setTimeout(function() {
			reject(new Error(ERR_PREFIX + 'Request timed out.'));
		}, this.timeout);
		this.socket.once('changeMedia', (data) => {
			clearTimeout(timeout);
			resolve(data);
		});
	});
	if(callback && typeof callback === 'function') {
		this.getCurrentMedia()
		.then(res => {
			callback(false, res);
		}).catch(err => {
			callback(err);
		});
	}
	else {
		return promise;
	}
};

/**
 * Retrieves information about the current playlist
 * @param {function} [callback] - A callback function, accepting an error (if any) and a the retrieved data as parameters. If none is provided, returns a Promise object instead.
 * @return {Promise} - A Promise that resolves to the playlist data in JSON format.
 */
CytubeConnection.prototype.getPlaylist = function(callback) {
	let promise = new Promise((resolve, reject) => {
		var timeout = !this.timeout ? undefined : setTimeout(function() {
			reject(new Error(ERR_PREFIX + 'Request timed out.'));
		}, this.timeout);
		this.socket.once('playlist', (data) => {
			clearTimeout(timeout);
			resolve(data);
		});
	});
	if(callback && typeof callback === 'function') {
		this.getPlaylist()
		.then(res => {
			callback(false, res);
		}).catch(err => {
			callback(err);
		});
	}
	else {
		return promise;
	}
};

/**
 * Retrieves information about the current users in a channel.
 * @param {function} [callback] - A callback function, accepting an error (if any) and a the retrieved data as parameters. If none is provided, returns a Promise object instead.
 * @return {Promise} - A Promise that resolves to the user data in JSON format.
 */
CytubeConnection.prototype.getUserlist = function(callback) {
	let promise = new Promise((resolve, reject) => {
		var timeout = !this.timeout ? undefined : setTimeout(function() {
			reject(new Error(ERR_PREFIX + 'Request timed out.'));
		}, this.timeout);
		this.socket.once('userlist', (data) => {
			clearTimeout(timeout);
			resolve(data);
		});
	});
	if(callback && typeof callback === 'function') {
		this.getUserlist()
		.then(res => {
			callback(false, res);
		}).catch(err => {
			callback(err);
		});
	}
	else {
		return promise;
	}
};

/**
 * Establishes a connection to a cytube socket server and joins a channel.
 * @param {Object} settings - A cytube-client settings object.
 * @param {function} [callback] - A callback function, accepting an error (if any) and a the retrieved data as parameters. If none is provided, returns a Promise object instead.
 * @return {Promise} - A Promise object that resolves to a CytubeConnection.
 * @api public
 */
let connect = function(settings, callback) {
	let promise = new Promise((resolve, reject) => {
		// Build settings object 
		if(typeof settings !== 'object') {
			settings = {
				channel: settings,
				secure: true,
				reconnection: true,
				timeout: DEFAULT_TIMEOUT
			}
		}
		if(!settings.channel) {
			reject(new Error(ERR_PREFIX + 'You must pass the name of a cytu.be channel or a settings object with a channel property.'));
		}
		let socketServer;

		// Establish the connection to the socket server, either using an explicit url or retrieving connection info from cytube.
		let socketPromise = new Promise((resolve, reject) => {
			let socket;
			if(settings.socketServer) {
				socketServer = settings.socketServer;
				socket = io(socketServer, {reconnection: settings.reconnection, transports: ['websocket']});
				resolve(socket);
			}
			else {
				let configUrl = CONFIG_URL.replace('%channel', settings.channel);
				axios({url: configUrl, responseType: 'json'})
					.then(res => {
						for(let val of res.data.servers) {
							if(settings.secure === val.secure) {
								socketServer = val.url;
								socket = io(socketServer, {reconnection: settings.reconnection, transports: ['websocket']});
							}
						}
						if(socket) {
							resolve(socket);
						}
						else {
							reject(new Error(ERR_PREFIX + 'Cytube did not respond with valid connection info for the specified channel.'));
						}
					}).catch(err => {
						reject(ERR_PREFIX + err);
					});
			}
		});

		// When the socket promise resolves, we can move forward and join channels.
		socketPromise.then(socket => {
			// CyTube doesn't have any post-joinChannel handshake. The first response on success is (usually) a setPermissions to the client
			socket.on('setPermissions', () => resolve(new CytubeConnection(socket, socketServer, settings.channel, typeof settings === 'object' && settings.timeout)));
			// CyTube doesn't give us a response to our login attempt,
			// it just sends another needPassword -- so we have to track it ourselves.
			// Confusingly, it can also send two requests before receiving our response,
			// so a counter is used to ensure at least one is an error response.
			let pwAttempted = 0;
			socket.on('needPassword', () => {
				if(settings.password) {
					if(pwAttempted > 2) {
						socket.close();
						reject(new Error(ERR_PREFIX + 'The password provided is not correct. Connection closed.'));
					}
					else {
						socket.emit('channelPassword', settings.password);
						pwAttempted++;
					}
				}
				else {
					socket.close();
					reject(new Error(ERR_PREFIX + 'The specified channel requires a password but one was not provided. Connection closed.'));
				}
			});
			// Set up connect handler now that post-join handlers are in place.
			socket.on('connect', () => {
				socket.emit('joinChannel', {
					name: settings.channel
				});
			});
		}).catch(err => {
			// If there was an error establishing connection, we just pass it upstream.
			reject(err);
		});
	});

	if(callback && typeof callback === 'function') {
		connect(settings)
		.then(res => {
			callback(false, res);
		}).catch(err => {
			callback(err);
		});
	}
	else {
		return promise;
	}
};

module.exports = {
	connect: connect
};