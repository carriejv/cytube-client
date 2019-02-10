'use strict';

/**
 * Module Dependencies
 */
let io = require('socket.io-client');
let axios = require('axios');

/**
 * Constants
 */
const CONFIG_URL = 'https://cytu.be/socketconfig/%channel.json';
const ERR_PREFIX = 'cytube-client: ';
const TIMEOUT = 10000;

/**
 * CytubeConnection defines the object returned by a public api call to connect.
 * A CytubeConnection represents a single connection to a socket server, listening to events on a single, immutible channel.
 * @constructor
 * @typedef {Object} CytubeConnection
 * @property {Object} socket - The Socket.io connection.
 * @property {string} socketServer - The url of the socket server.
 * @property {string} channel - The channel on which to listen for events.
 */
let CytubeConnection = function(socket, socketServer, channel) {
	this.socket = socket;
	this.socketServer = socketServer;
	this.channel = channel;
};

/**
 * Attaches a listener for an event.
 * @param {string} event - An event id.
 * @param {function} callback - Callback with one argument, containing the response data for the event.
 */
CytubeConnection.prototype.on = function(event, callback) {
	this.socket.on(event, (res) => {
		callback(res);
	});
};

/**
 * Listens for a single occurance of an event.
 * @param {string} event - An event id.
 * @param {function} callback - Callback with one argument, containing the response data for the event.
 */
CytubeConnection.prototype.once = function(event, callback) {
	this.socket.once(event, (res) => {
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
	let promise = new Promise( (resolve, reject) => {
		var timeout = setTimeout(function() {
			reject(ERR_PREFIX + 'Request timed out.');
		}, TIMEOUT);
		this.socket.once('changeMedia', (data) => {
			clearTimeout(timeout);
			resolve(data);
		});
	});
	if(callback && typeof callback === 'function') {
		this.getCurrentMedia()
		.then( (res) => {
			callback(false, res);
		}).catch( (err) => {
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
	let promise = new Promise( (resolve, reject) => {
		var timeout = setTimeout(function() {
			reject(ERR_PREFIX + 'Request timed out.');
		}, TIMEOUT);
		this.socket.once('playlist', (data) => {
			clearTimeout(timeout);
			resolve(data);
		});
	});
	if(callback && typeof callback === 'function') {
		this.getPlaylist()
		.then( (res) => {
			callback(false, res);
		}).catch( (err) => {
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
	let promise = new Promise( (resolve, reject) => {
		var timeout = setTimeout(function() {
			reject(ERR_PREFIX + 'Request timed out.');
		}, TIMEOUT);
		this.socket.once('userlist', (data) => {
			clearTimeout(timeout);
			resolve(data);
		});
	});
	if(callback && typeof callback === 'function') {
		this.getUserlist()
		.then( (res) => {
			callback(false, res);
		}).catch( (err) => {
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
	let promise = new Promise( (resolve, reject) => {
		let channel = (settings.channel ? settings.channel : settings);
		let socketServer;

		if(!channel) {
			reject(ERR_PREFIX + 'You must pass the name of a cytu.be channel or a settings object with a channel property.');
		}

		// Establish the connection to the socket server, either using an explicit url or retrieving connection info from cytube.
		let socketPromise = new Promise( (resolve, reject) => {
			let socket;
			// Test for secure and reconnection explicitly being set to false (default true);
			let secure = (settings.secure == false ? false : true);
			let reconnection = (settings.reconnection == false ? false : true);
			if(settings.socketServer) {
				socketServer = settings.socketServer;
				socket = io(socketServer, {reconnection: reconnection});
				resolve(socket);
			}
			else {
				let configUrl = CONFIG_URL.replace('%channel', channel);
				axios({url: configUrl, responseType: 'json'})
					.then( (res) => {
						for(let val of res.data.servers) {
							if(secure == val.secure) {
								socketServer = val.url;
								socket = io(socketServer, {reconnection: reconnection});
							}
						}
						if(socket) {
							resolve(socket);
						}
						else {
							reject(ERR_PREFIX + 'Cytube did not respond with valid connection info for the specified channel.')
						}
					}).catch( (err) => {
						reject(ERR_PREFIX + err);
					});
			}
		});

		// When the socket promise resolves, we can move forward and join channels.
		socketPromise.then( (res) => {
			let socket = res;
			let join = function() {
				socket.on('connect', () => {
					socket.emit('joinChannel', {
						name: channel
					});
				});
			};
			// CyTube doesn't give us a response to our login attempt, it just sends another needPassword -- so we have to track it ourselves.
			let pwAttempted = false;
			socket.on('needPassword', () => {
				if(settings.password) {
					if(pwAttempted) {
						console.error(ERR_PREFIX + 'The password provided is not correct. Connection closed.');
						socket.close();
					}
					else {
						socket.emit('channelPassword', settings.password);
						pwAttempted = true;
					}
				}
				else {
					console.error(ERR_PREFIX + 'The specified channel requires a password but one was not provided. Connection closed.');
					socket.close();
				}
			});

			join();
			let connection = new CytubeConnection(socket, socketServer, channel);
			resolve(connection);

		}).catch( (err) => {
			// If there was an error establishing connection, we just pass it upstream.
			reject(err);
		});
	});
	if(callback && typeof callback === 'function') {
		connect(settings)
		.then( (res) => {
			callback(false, res);
		}).catch( (err) => {
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