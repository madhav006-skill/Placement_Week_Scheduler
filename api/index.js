const app = require('../backend/src/index');

module.exports = (req, res) => {
  // Reconstruct req.url from Vercel rewrite query parameter
  if (req.query && req.query.path) {
    req.url = '/api/' + req.query.path;
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
