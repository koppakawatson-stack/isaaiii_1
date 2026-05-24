import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Warning: Could not connect to MongoDB at ${process.env.MONGO_URI}. Ensure MongoDB is running.`);
    console.log('Express backend will run, but database features will be disabled/offline.');
  }
};

export default connectDB;
