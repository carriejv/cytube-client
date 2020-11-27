'use strict';

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const cytubeClient = require('../index.js');

const TGT_CHANNEL = process.env['CYTUBE_TEST_CHANNEL'];

describe('cytube-client', function() {

    describe('Cytu.be Integration Test -- Set CYTUBE_TEST_CHANNEL env to target channel.', function() {

		it(`should connect to a public channel [${TGT_CHANNEL || 'No CYTUBE_TEST_CHANNEL set!'}]`, async function() {
            const client = await cytubeClient.connect(TGT_CHANNEL);
            const currentMedia = await client.getCurrentMedia();

            console.log('Got a response!');
            console.dir(currentMedia);

            currentMedia.should.not.equal(undefined);
        });

    });

});