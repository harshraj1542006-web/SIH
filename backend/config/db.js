// Handle connection error event to prevent unhandled EventEmitter exceptions
const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS not allowed by system
}

mongoose.connection.on('error', (err) => {
  // Background reconnection error handler
});

const connectDB = async () => {
  let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sahakari_shramik';

  // Automatically strip accidental '<' and '>' angle brackets from password in URI
  if (uri.includes(':<') && uri.includes('>@')) {
    uri = uri.replace(/:<([^>]+)>@/, ':$1@');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Notice] Database connection to ${uri} was not established (${error.message}).`);
    console.warn('[MongoDB Guidance] How to connect MongoDB:');
    console.warn('  1. Local MongoDB: Start the service via "net start MongoDB" or "mongod"');
    console.warn('  2. MongoDB Atlas (Cloud): Add your connection URI to backend/.env:');
    console.warn('     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sahakari_shramik?retryWrites=true&w=majority');
    console.warn(`[MongoDB] Express server remains active on port ${process.env.PORT || 5000}.`);
    return null;
  }
};

module.exports = connectDB;
