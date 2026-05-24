import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import productRoutes from './routes/productRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

import User from './models/User.js';
import Product from './models/Product.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware to attach io to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect to Database and Seed
const init = async () => {
  await connectDB();
  try {
    const adminExists = await User.findOne({ email: 'admin@company.com' });
    if (!adminExists) {
      await User.create({
        name: 'Administrator',
        email: 'admin@company.com',
        password: 'Password123!',
        role: 'Admin'
      });
      console.log('Seeded default admin user: admin@company.com / Password123!');
    }

    // Seed Manufacturing Products
    const productsCount = await Product.countDocuments();
    if (productsCount === 0) {
      await Product.insertMany([
        { name: 'CNC Milling Machine VMC-850', category: 'Machinery', price: 45000, availability: true, description: 'High-speed vertical CNC milling machine for precision steel molding.' },
        { name: 'Hydraulic Press HP-200T', category: 'Machinery', price: 28000, availability: true, description: '200-ton hydraulic pressing equipment for heavy metal stamping.' },
        { name: 'Pneumatic Drill Press PD-50', category: 'Tooling', price: 4200, availability: true, description: 'Industrial automated drill press with pneumatic depth controls.' },
        { name: 'Laser Cutting System LC-3015', category: 'Machinery', price: 85000, availability: true, description: '3kW fiber laser cutter with dual shuttle tables.' },
        { name: 'Industrial Conveyor Belt CB-12', category: 'Tooling', price: 12500, availability: false, description: 'Modular variable speed conveyor system for material transport.' },
        { name: 'Carbide Endmill Tools Pack', category: 'Raw Materials', price: 850, availability: true, description: 'Pack of 10 solid carbide endmills for high-hardness metal alloy.' }
      ]);
      console.log('Seeded default manufacturing product inventory');
    }
  } catch (err) {
    console.log('Database seeding warning:', err.message);
  }
};
init();

// Socket.io connection logs
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/activity-logs', activityRoutes);

// Basic Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'BDA Management System API is running successfully' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
