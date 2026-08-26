const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is loaded if running locally

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not defined.');
        }
        
        await mongoose.connect(mongoUri);
        
        console.log(`MongoDB connected successfully`);
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    await mongoose.disconnect();
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
