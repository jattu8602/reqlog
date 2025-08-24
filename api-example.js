// Simple Node.js API example for receiving logs from the Chrome extension
const express = require('express')
const { MongoClient } = require('mongodb')
const cors = require('cors')

const app = express()
const PORT = 3000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB connection
let db

async function connectToMongoDB(mongodbUrl) {
  try {
    const client = new MongoClient(mongodbUrl)
    await client.connect()
    db = client.db()
    console.log('Connected to MongoDB')
    return true
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    return false
  }
}

// API Routes

// Store conversation messages
app.post('/api/conversations', async (req, res) => {
  try {
    const { mongodb_url, ...messageData } = req.body

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    const collection = db.collection('conversations')
    const result = await collection.insertOne({
      ...messageData,
      createdAt: new Date(),
    })

    res.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Error storing conversation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Store privacy warnings
app.post('/api/warnings', async (req, res) => {
  try {
    const { mongodb_url, ...warningData } = req.body

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    const collection = db.collection('warnings')
    const result = await collection.insertOne({
      ...warningData,
      createdAt: new Date(),
    })

    res.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Error storing warning:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get dashboard data
app.post('/api/dashboard', async (req, res) => {
  try {
    const { mongodb_url } = req.body

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    // Get recent warnings
    const warningsCollection = db.collection('warnings')
    const recentWarnings = await warningsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Get recent conversations
    const conversationsCollection = db.collection('conversations')
    const recentConversations = await conversationsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    // Get statistics
    const totalWarnings = await warningsCollection.countDocuments()
    const totalConversations = await conversationsCollection.countDocuments()

    // Get unique websites
    const uniqueWebsites = await conversationsCollection.distinct('website')

    // Get risk analysis
    const riskAnalysis = await warningsCollection
      .aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Get website analysis
    const websiteAnalysis = await warningsCollection
      .aggregate([
        {
          $group: {
            _id: '$website',
            warningCount: { $sum: 1 },
            highRiskCount: {
              $sum: {
                $cond: [{ $eq: ['$severity', 'high'] }, 1, 0],
              },
            },
            lastWarning: { $max: '$createdAt' },
          },
        },
        {
          $sort: { warningCount: -1 },
        },
        {
          $limit: 10,
        },
      ])
      .toArray()

    res.json({
      success: true,
      data: {
        recentWarnings,
        recentConversations,
        statistics: {
          totalWarnings,
          totalConversations,
          uniqueWebsites: uniqueWebsites.length,
        },
        riskAnalysis,
        websiteAnalysis,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get conversation history
app.get('/api/conversations/:botId', async (req, res) => {
  try {
    const { botId } = req.params
    const { mongodb_url } = req.query

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    const collection = db.collection('conversations')
    const conversations = await collection
      .find({ botId })
      .sort({ timestamp: 1 })
      .toArray()

    res.json({ success: true, conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get warning history
app.get('/api/warnings', async (req, res) => {
  try {
    const { website, severity, limit = 50 } = req.query
    const { mongodb_url } = req.query

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    const collection = db.collection('warnings')
    let query = {}

    if (website) query.website = website
    if (severity) query.severity = severity

    const warnings = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray()

    res.json({ success: true, warnings })
  } catch (error) {
    console.error('Error fetching warnings:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get website analysis
app.get('/api/websites/analysis', async (req, res) => {
  try {
    const { mongodb_url } = req.query

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    const warningsCollection = db.collection('warnings')
    const conversationsCollection = db.collection('conversations')

    const websiteAnalysis = await warningsCollection
      .aggregate([
        {
          $group: {
            _id: '$website',
            totalWarnings: { $sum: 1 },
            highRiskWarnings: {
              $sum: {
                $cond: [{ $eq: ['$severity', 'high'] }, 1, 0],
              },
            },
            mediumRiskWarnings: {
              $sum: {
                $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0],
              },
            },
            lowRiskWarnings: {
              $sum: {
                $cond: [{ $eq: ['$severity', 'low'] }, 1, 0],
              },
            },
            lastWarning: { $max: '$timestamp' },
            riskTypes: { $addToSet: '$risks.type' },
          },
        },
        {
          $sort: { totalWarnings: -1 },
        },
      ])
      .toArray()

    // Add conversation counts
    for (let website of websiteAnalysis) {
      const conversationCount = await conversationsCollection.countDocuments({
        website: website._id,
      })
      website.conversationCount = conversationCount
    }

    res.json({ success: true, websiteAnalysis })
  } catch (error) {
    console.error('Error analyzing websites:', error)
    res.status(500).json({ error: error.message })
  }
})

// Export data
app.get('/api/export', async (req, res) => {
  try {
    const { mongodb_url, type = 'all' } = req.query

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    let data = {}

    if (type === 'all' || type === 'conversations') {
      const conversationsCollection = db.collection('conversations')
      data.conversations = await conversationsCollection.find({}).toArray()
    }

    if (type === 'all' || type === 'warnings') {
      const warningsCollection = db.collection('warnings')
      data.warnings = await warningsCollection.find({}).toArray()
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ai-bot-data-${Date.now()}.json"`
    )
    res.json(data)
  } catch (error) {
    console.error('Error exporting data:', error)
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`AI Bot Privacy Guard API server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log('Ready to receive bot detection data...')
})
