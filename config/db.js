const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log('MongoDB disabled. Using local JSON session storage.');
    return;
  }

  try {
    const mongoose = require('mongoose');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
