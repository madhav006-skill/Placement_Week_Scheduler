const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is loaded if running locally

const connectDB = async () => {
    try {
        const user = 'amankumar4552023_db_user';
        const pass = 'PrhoUu1kdnzkhk4m';
        const cluster = 'cluster0.o2mltet.mongodb.net';
        const mongoUri = process.env.MONGODB_URI || `mongodb+srv://${user}:${pass}@${cluster}/?appName=Cluster0`;
        
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
