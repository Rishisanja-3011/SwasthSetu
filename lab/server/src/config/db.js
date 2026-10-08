const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vaanidoc';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[VaaniDoc MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[VaaniDoc MongoDB] Connection error: ${error.message}`);
    console.warn(`[VaaniDoc MongoDB] Continuing with server startup. Check MongoDB status.`);
  }
};

module.exports = connectDB;
