const mongoose = require('mongoose');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not found in .env.local');
  process.exit(1);
}

console.log('🔗 Testing MongoDB connection...');
console.log(`📋 Connection string: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`); // Hide password

async function testConnection() {
  try {
    // Set connection options
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    };

    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Connect to MongoDB
    const startTime = Date.now();
    await mongoose.connect(MONGODB_URI, options);
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ MongoDB connected successfully in ${connectionTime}ms`);
    
    // Check connection state
    console.log(`📊 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // List available databases
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log(`🗃️ Available databases: ${databases.databases.map(db => db.name).join(', ')}`);
    
    // Check if the ramz database exists
    const ramzDbExists = databases.databases.some(db => db.name === 'ramz');
    console.log(`📁 'ramz' database exists: ${ramzDbExists ? '✅ Yes' : '❌ No'}`);
    
    // List collections in ramz database if it exists
    if (ramzDbExists) {
      const collections = await mongoose.connection.db.collections();
      console.log(`📋 Collections in 'ramz' database: ${collections.map(col => col.collectionName).join(', ')}`);
    }
    
    // Close the connection
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 This usually means:');
      console.error('   - The MongoDB server is not running');
      console.error('   - The connection string is incorrect');
      console.error('   - Network connectivity issues');
      console.error('   - Firewall blocking the connection');
    }
    process.exit(1);
  }
}

testConnection();
