const app = require('../backend/src/index');

module.exports = (req, res) => {
  if (req.query && req.query.path) {
    req.url = '/api/' + req.query.path;
  }
  return app(req, res);
};
