const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const apiRoutes = require('./routes/api');

const app = express();

// Configure CORS
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB().then(() => {
    // Only listen if not running in Vercel serverless environment
    if (!process.env.VERCEL) {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
});

module.exports = app;
