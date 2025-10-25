import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const client = new MongoClient(MONGO_URL);

async function connectDB() {
  try {
    await client.connect();
    db = client.db('oogly_analytics');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Ping endpoint
app.post('/api/v1/ping', async (req, res) => {
  try {
    const { session_id, user_agent, device_type } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const sessions = db.collection('sessions');
    
    // Upsert session
    await sessions.updateOne(
      { session_id },
      {
        $set: {
          user_agent: user_agent || 'unknown',
          device_type: device_type || 'unknown',
          updated_at: new Date()
        },
        $setOnInsert: {
          created_at: new Date()
        }
      },
      { upsert: true }
    );

    // Clean old sessions (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await sessions.deleteMany({ updated_at: { $lt: sevenDaysAgo } });

    res.json({
      success: true,
      session_id
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
```
Click **"Commit new file"**

---

## Step 3: Connect GitHub to Railway

Back in Railway:

1. Delete that empty service you just created
2. Click **"+ New"** again
3. Select **"GitHub Repo"**
4. Click **"Configure GitHub App"**
5. Authorize Railway to access your repos
6. Select your `oogly-analytics-api` repo
7. Click **"Deploy"**

Railway will automatically detect it's a Node.js app and start building!

---

## Step 4: Add MongoDB Connection String

1. Click on your **new API service** (not MongoDB)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Click **"Add Reference"** → Select your MongoDB service → Choose `MONGO_URL`
   - OR manually add: 
     - Variable: `MONGO_URL`
     - Value: (copy from MongoDB service variables tab)

---

## Step 5: Generate Public URL

1. Stay in your API service
2. Click **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy the URL (e.g., `https://oogly-analytics-api-production.up.railway.app`)

---

## Step 6: Test It!

Open your browser and go to:
```
https://your-railway-url.up.railway.app/health
