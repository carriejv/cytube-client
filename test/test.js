'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();
const io = require('socket.io');
const cytubeClient = require('../index.js');

const testOptions = {
	socketServer: 'http://localhost:3000',
	channel: 'test',
	reconnection: false
};

let server;
let socket;
let client;

const standardHandshake = function(newSocket) {
	socket = newSocket
	socket.on('joinChannel', () => server.emit('setPermissions'));
};

const passwordHandshake = function(newSocket) {
	socket = newSocket
	socket.on('joinChannel', () => server.emit('needPassword'));
	socket.on('channelPassword', password => {
		if(password === 'password') {
			server.emit('setPermissions');
		}
		else {
			server.emit('needPassword');
		}
	});
};

describe('cytube-client', () => {

	beforeEach(() => {
		// Create new io server.
		server = io().listen(3000);
		client = null;
		// Emulate the 'handshake' of cytube on a successful joinChannel
		server.on('connection', standardHandshake);
	});

	afterEach(() => {
		server.close();
		if(client) {
			client.close();
		}
	});

	describe('#connect()', () => {

		it('should not work with no arguments', async () => {
			try {
				client = await cytubeClient.connect();
			}
			catch(err) {
				err.should.not.equal(undefined);
				return;
			}
			throw new Error('No error thrown.');
		});

		it('should resolve with valid settings', async () => {
			client = await cytubeClient.connect(testOptions);
			client.should.not.equal(undefined);
		});

		it('should disconnect with an error if a password is required but not supplied', async () => {
			// Rebuild a password-handshaking server instead of the standard built in beforeEach.
			server.close();
			server = io().listen(3000);
			client = null;
			server.on('connection', passwordHandshake);

			try {
				client = await cytubeClient.connect(testOptions);
			}
			catch(err) {
				err.message.should.contain('password');
				return;
			}
			throw new Error('No error thrown.');
		});

		it('should disconnect with an error if a password is required but incorrect', async () => {
			// Rebuild a password-handshaking server instead of the standard built in beforeEach.
			server.close();
			server = io().listen(3000);
			client = null;
			server.on('connection', passwordHandshake);

			let passOptions = Object.assign({}, testOptions);
			passOptions.password = 'nope';

			try {
				client = await cytubeClient.connect(passOptions);
			}
			catch(err) {
				err.message.should.contain('password');
				return;
			}
			throw new Error('No error thrown.');
		});

		it('should attempt to authenticate if required and a password is provided', done => {
			// Rebuild a password-handshaking server instead of the standard built in beforeEach.
			server.close();
			server = io().listen(3000);
			client = null;
			server.on('connection', passwordHandshake);

			let passOptions = Object.assign({}, testOptions);
			passOptions.password = 'password';
			cytubeClient.connect(passOptions, (err, res) => {
				if(err) {
					done(err);
					return;
				}
				client = res;	
				done();
			});
		});

		it('should also work with a callback', done => {
			client = cytubeClient.connect(testOptions, (err, res) => {
				if(!err && res) {
					client = res;
					done();
				}
				else {
					done(err);
				}
			});
		});

		it('should set a custom timeout', async () => {
			client = await cytubeClient.connect(Object.assign({timeout: 15000}, testOptions));
			client.should.not.equal(undefined);
			client.timeout.should.equal(15000);
		});

		it('should set a default timeout', async () => {
			client = await cytubeClient.connect(Object.assign(testOptions));
			client.should.not.equal(undefined);
			client.timeout.should.equal(10000);
		});

	});

	describe('CytubeConnection', () => {

		describe('#getCurrentMedia()', () => {

			it('should return the value emitted on changeMedia', done => {
				cytubeClient.connect(testOptions)
				.then(function(res) {
					client = res;
					res.getCurrentMedia().should.eventually.equal('Success!').notify(done);
					server.emit('changeMedia', 'Success!');
				})
				.catch(function(err) {
					done(err);
				});
			});

			it('should also work with a callback', done => {
				cytubeClient.connect(testOptions)
				.then(function(res) {
					client = res;
					res.getCurrentMedia((err, data) => {
						if(!err && data === 'Success!') {
							done();
						}
						else {
							done(err);
						}
					});
					server.emit('changeMedia', 'Success!');
				})
				.catch(function(err) {
					done(err);
				});
			});

		});

		describe('#getPlaylist()', () => {

			it('should return the value emitted on playlist', done => {
				cytubeClient.connect(testOptions)
				.then(function(res) {
					client = res;
					res.getPlaylist().should.eventually.equal('Success!').notify(done);
					server.emit('playlist', 'Success!');
				})
				.catch(function(err) {
					done(err);
				});
			});

			it('should also work with a callback', done => {
				client = cytubeClient.connect(testOptions)
				.then(function(res) {
					client = res;
					res.getPlaylist((err, data) => {
						if(!err && data === 'Success!') {
							done();
						}
						else {
							done(err);
						}
					});
					server.emit('playlist', 'Success!');
				})
				.catch(function(err) {
					done(err);
				});
			});

		});

		describe('#getUserlist()', () => {

			it('should return the value emitted on userlist', function(done) {
				cytubeClient.connect(testOptions)
				.then(function(res) {
					client = res;
					res.getUserlist().should.eventually.equal('Success!').notify(done);
					server.emit('userlist', 'Success!');
				})
				.catch(function(err) {
					done(err);
				});
			});

			it('should also work with a callback', function(done) {
				cytubeClient.connect(testOptions)
				.then(function(res) {
					client = res;
					res.getUserlist((err, data) => {
						if(!err && data === 'Success!') {
							done();
						}
						else {
							done(err);
						}
					});
					server.emit('userlist', 'Success!');
				})
				.catch(function(err) {
					done(err);
				});
			});

		});

	});

});