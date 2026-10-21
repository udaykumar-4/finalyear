require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import User model for auto-seeding
const User = require('./models/user');

// Import main router
const mainApiRouter = require('./routes/index');

const path = require('path');
const fs = require('fs');
const cacheService = require('./services/cache/cacheService');

const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 
app.set('etag', 'strong'); // Enable HTTP ETag generation

// --- API Cache Protection Middleware ---
// Protect medical privacy: prevent shared proxies/CDNs from caching private medical data
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Cache Metrics Endpoint
app.get('/api/cache/metrics', (req, res) => {
  res.json(cacheService.getMetrics());
});

// --- Routes ---
app.use('/api', mainApiRouter); 

// --- Static Frontend Serving with HTTP Cache Headers ---
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  // Content-hashed immutable assets (Vite bundle JS, CSS, chunk files)
  app.use('/assets', express.static(path.join(frontendDist, 'assets'), {
    maxAge: '1y',
    immutable: true
  }));

  // General static files (favicon, logos)
  app.use(express.static(frontendDist, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} 

// --- Auto-Seed Demo Users ---
const seedDemoUsers = async () => {
  const demoAccounts = [
    { full_name: 'System Administrator', email: 'admin@ayursutra.com', password: 'password123', role: 'admin', designation: 'Chief Administrator' },
    { full_name: 'Dr. Ananya Sharma', email: 'doctor@ayursutra.com', password: 'password123', role: 'doctor', designation: 'Senior Ayurvedic Physician' },
    { full_name: 'Rajesh Varma', email: 'therapist@ayursutra.com', password: 'password123', role: 'therapist', designation: 'Panchakarma Therapist' },
    { full_name: 'Priya Nair', email: 'receptionist@ayursutra.com', password: 'password123', role: 'receptionist', designation: 'Front Desk Officer' },
    { full_name: 'Aarav Patel', email: 'patient@ayursutra.com', password: 'password123', role: 'patient' }
  ];

  for (const account of demoAccounts) {
    try {
      const exists = await User.findOne({ email: account.email });
      if (!exists) {
        await User.create(account);
        console.log(`✅ Seeded demo account: ${account.email} (${account.role})`);
      }
    } catch (err) {
      console.warn(`Seeding warning for ${account.email}:`, err.message);
    }
  }
};

// --- Database Connection ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDemoUsers();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (0.0.0.0)`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is already in use by another process.`);
        console.error(`👉 To free port ${PORT} on Windows PowerShell, run: npx kill-port ${PORT}`);
      } else {
        console.error('Server error:', err);
      }
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });