'use strict';

const server = require('./bootstrap/server');

if (require.main === module) {
  server.listen(process.env.PORT || 3000, process.env.HOST || '127.0.0.1', () => {
    console.log(`Neutral platform server listening on http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 3000}`);
  });
}

module.exports = server;
