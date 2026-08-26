const app = require('../backend/src/index');

module.exports = (req, res) => {
  // Ensure the URL starts with /api so that Express app.use('/api') matches
  // Vercel serverless functions sometimes strip the mount path.
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
