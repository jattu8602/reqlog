// Simple Node.js API example for receiving logs from the Chrome extension
const express = require('express')
const { MongoClient } = require('mongodb')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// MongoDB connection
const MONGODB_URL =
  'mongodb+srv://reqlog:reqlog@reqlog.fvlzk2o.mongodb.net/reqlog?retryWrites=true&w=majority&appName=reqlog'
let db

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URL)
    await client.connect()
    db = client.db('reqlog')
    console.log('Connected to MongoDB')

    // Create indexes for better performance
    await db.collection('logs').createIndex({ timestamp: -1 })
    await db.collection('logs').createIndex({ url: 1 })
    await db.collection('logs').createIndex({ method: 1 })
  } catch (error) {
    console.error('MongoDB connection error:', error)
  }
}

// API endpoint to receive logs
app.post('/api/logs', async (req, res) => {
  try {
    const logEntry = req.body

    // Add server timestamp
    logEntry.server_received_at = new Date().toISOString()

    // Clean up sensitive data (optional)
    if (logEntry.request_body && logEntry.request_body.password) {
      logEntry.request_body.password = '***REDACTED***'
    }

    // Store in MongoDB
    if (db) {
      const result = await db.collection('logs').insertOne(logEntry)
      console.log(`Log stored with ID: ${result.insertedId}`)
    }

    // Log to console for debugging
    console.log('Received log:', {
      url: logEntry.url,
      method: logEntry.method,
      status: logEntry.status_code,
      timestamp: logEntry.timestamp,
    })

    res.status(200).json({
      success: true,
      message: 'Log received and stored',
      logId: db ? result.insertedId : null,
    })
  } catch (error) {
    console.error('Error processing log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process log',
    })
  }
})

// Get logs (for debugging/viewing)
app.get('/api/logs', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' })
    }

    const limit = parseInt(req.query.limit) || 100
    const logs = await db
      .collection('logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    res.json({
      success: true,
      count: logs.length,
      logs: logs,
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    res.status(500).json({ error: 'Failed to fetch logs' })
  }
})

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' })
    }

    const stats = await db
      .collection('logs')
      .aggregate([
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            uniqueUrls: { $addToSet: '$url' },
            methods: { $addToSet: '$method' },
            avgLatency: { $avg: '$latency_ms' },
            totalErrors: {
              $sum: { $cond: [{ $ne: ['$error', null] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalLogs: 1,
            uniqueUrls: { $size: '$uniqueUrls' },
            methods: 1,
            avgLatency: { $round: ['$avgLatency', 2] },
            totalErrors: 1,
          },
        },
      ])
      .toArray()

    res.json({
      success: true,
      stats: stats[0] || {},
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected',
  })
})

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await connectToMongoDB()
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  process.exit(0)
})
