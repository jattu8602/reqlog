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

// Batch store conversations
app.post('/api/conversations/batch', async (req, res) => {
  try {
    const { mongodb_url, messages } = req.body

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty messages array' })
    }

    console.log(`Processing batch of ${messages.length} conversations...`)

    const collection = db.collection('conversations')
    const results = []

    // Process messages in smaller chunks to avoid memory issues
    const chunkSize = 50
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize)

      const chunkResults = await collection.insertMany(
        chunk.map((msg) => ({
          ...msg,
          createdAt: new Date(),
          batchProcessed: true,
          batchTimestamp: new Date().toISOString(),
        }))
      )

      results.push(...Object.values(chunkResults.insertedIds))
    }

    console.log(
      `Successfully processed ${messages.length} conversations in batch`
    )
    res.json({
      success: true,
      count: messages.length,
      ids: results,
      message: `Batch processed ${messages.length} conversations successfully`,
    })
  } catch (error) {
    console.error('Error processing conversation batch:', error)
    res.status(500).json({ error: error.message })
  }
})

// Batch store warnings
app.post('/api/warnings/batch', async (req, res) => {
  try {
    const { mongodb_url, warnings } = req.body

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    if (!warnings || !Array.isArray(warnings) || warnings.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty warnings array' })
    }

    console.log(`Processing batch of ${warnings.length} warnings...`)

    const collection = db.collection('warnings')
    const results = []

    // Process warnings in smaller chunks to avoid memory issues
    const chunkSize = 50
    for (let i = 0; i < warnings.length; i += chunkSize) {
      const chunk = warnings.slice(i, i + chunkSize)

      const chunkResults = await collection.insertMany(
        chunk.map((warning) => ({
          ...warning,
          createdAt: new Date(),
          batchProcessed: true,
          batchTimestamp: new Date().toISOString(),
        }))
      )

      results.push(...Object.values(chunkResults.insertedIds))
    }

    console.log(`Successfully processed ${warnings.length} warnings in batch`)
    res.json({
      success: true,
      count: warnings.length,
      ids: results,
      message: `Batch processed ${warnings.length} warnings successfully`,
    })
  } catch (error) {
    console.error('Error processing warning batch:', error)
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

// Test endpoint to verify extension communication
app.post('/api/test', async (req, res) => {
  try {
    const { mongodb_url, testData } = req.body

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    // Store test data
    const collection = db.collection('test_data')
    const result = await collection.insertOne({
      ...testData,
      testType: 'extension_test',
      createdAt: new Date(),
      timestamp: new Date().toISOString(),
    })

    console.log('Test data received and stored:', testData)
    res.json({
      success: true,
      id: result.insertedId,
      message: 'Test data received and stored successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error processing test data:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get real-time stats
app.get('/api/stats/realtime', async (req, res) => {
  try {
    const { mongodb_url } = req.query

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    // Get recent activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const recentConversations = await db
      .collection('conversations')
      .find({ createdAt: { $gte: fiveMinutesAgo } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    const recentWarnings = await db
      .collection('warnings')
      .find({ createdAt: { $gte: fiveMinutesAgo } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    const totalConversations = await db
      .collection('conversations')
      .countDocuments()
    const totalWarnings = await db.collection('warnings').countDocuments()

    res.json({
      success: true,
      realtime: {
        recentConversations,
        recentWarnings,
        totalConversations,
        totalWarnings,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching real-time stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get queue status and health
app.get('/api/queue/status', async (req, res) => {
  try {
    const { mongodb_url } = req.query

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    // Get recent activity counts
    const recentConversations = await db
      .collection('conversations')
      .find({ createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } })
      .count()

    const recentWarnings = await db
      .collection('warnings')
      .find({ createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } })
      .count()

    const totalConversations = await db
      .collection('conversations')
      .countDocuments()
    const totalWarnings = await db.collection('warnings').countDocuments()

    res.json({
      success: true,
      status: 'healthy',
      recentActivity: {
        conversations: recentConversations,
        warnings: recentWarnings,
      },
      totals: {
        conversations: totalConversations,
        warnings: totalWarnings,
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting queue status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Force process any pending data
app.post('/api/queue/force-process', async (req, res) => {
  try {
    const { mongodb_url } = req.body

    if (!db) {
      const connected = await connectToMongoDB(mongodb_url)
      if (!connected) {
        return res.status(500).json({ error: 'Failed to connect to MongoDB' })
      }
    }

    // This endpoint can be used to manually trigger processing
    res.json({
      success: true,
      message: 'Force process endpoint ready',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in force process endpoint:', error)
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
