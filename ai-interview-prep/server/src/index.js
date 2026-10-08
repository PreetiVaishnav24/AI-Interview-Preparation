import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const { MONGODB_URI, JWT_SECRET, PORT = 5000 } = process.env;
if (!MONGODB_URI || !JWT_SECRET) {
  console.error('Missing MONGODB_URI or JWT_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
console.log('MongoDB connected');
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
