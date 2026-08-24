'use strict';

const server = require('./bootstrap/server');

if (require.main === module) {
  const host = process.env.HOST || process.env.PUBLIC_HOST || process.env.SERVER_HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 3000);
  server.listen(port, host, () => {
    console.log(`Neutral platform server listening on http://${host}:${port}`);
  });
}

module.exports = server;
