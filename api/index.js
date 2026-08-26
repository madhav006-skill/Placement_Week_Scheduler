const app = require('../backend/src/index');

module.exports = (req, res) => {
  // Extract path from query string natively
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathParam = urlObj.searchParams.get('path');
  
  if (pathParam) {
    req.url = '/api/' + pathParam;
  }
  return app(req, res);
};
