/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { logger } from '@donategifts/helper';

const socket = require('socket.io');

const connectSocket = (app): any => {
	let server: http.Server | https.Server;
	if (process.env.LOCAL_DEVELOPMENT) {
		server = http.createServer(app);
	} else {
		const options = {
			key: fs.readFileSync('/etc/letsencrypt/live/dev.donate-gifts.com/privkey.pem'),
			cert: fs.readFileSync('/etc/letsencrypt/live/dev.donate-gifts.com/cert.pem'),
		};

		server = https.createServer(options, app);
	}

	const io = socket(server, {
		handlePreflightRequest: (_, req, res) => {
			const headers = {
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Allow-Origin': req.headers.origin, // or the specific origin you want to give access to,
				'Access-Control-Allow-Credentials': 'true',
			};
			res.writeHead(200, headers);
			res.end();
		},
	});

	server.listen(3010, () => {
		logger.info(`app and socket listening on: 3010`);
	});

	return io;
};

export { connectSocket };
