// AI Bot Privacy Guard Background Service Worker
const GEMINI_API_KEY = 'AIzaSyC0P9KY3lAjFTy73kHTFJ34VC8HoSJgy-Y'
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
const MONGODB_URL =
  'mongodb+srv://reqlog:reqlog@reqlog.fvlzk2o.mongodb.net/reqlog?retryWrites=true&w=majority&appName=reqlog'

// State management
let detectedBots = new Map()
let conversationHistory = new Map()
let privacyWarnings = []
let isMonitoringEnabled = true
let botDetectionStats = {
  totalBots: 0,
  totalConversations: 0,
  totalWarnings: 0,
  lastUpdated: new Date().toISOString(),
}

// Async Queue System for MongoDB operations
class AsyncMongoDBQueue {
  constructor() {
    this.messageQueue = []
    this.warningQueue = []
    this.isProcessing = false
    this.batchSize = 10
    this.syncInterval = 30000 // 30 seconds
    this.maxRetries = 3

    // Start the async processing
    this.startAsyncProcessing()
  }

  // Add message to queue
  addMessage(messageData) {
    this.messageQueue.push({
      ...messageData,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    })
    console.log(
      'Message added to async queue. Queue size:',
      this.messageQueue.length
    )
  }

  // Add warning to queue
  addWarning(warningData) {
    this.warningQueue.push({
      ...warningData,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    })
    console.log(
      'Warning added to async queue. Queue size:',
      this.warningQueue.length
    )
  }

  // Start async processing
  startAsyncProcessing() {
    // Process queues every 30 seconds
    setInterval(() => {
      this.processQueues()
    }, this.syncInterval)

    // Also process when queues get large
    setInterval(() => {
      if (
        this.messageQueue.length >= this.batchSize ||
        this.warningQueue.length >= this.batchSize
      ) {
        this.processQueues()
      }
    }, 5000) // Check every 5 seconds
  }

  // Process all queues asynchronously
  async processQueues() {
    if (this.isProcessing) {
      console.log('Queue processing already in progress, skipping...')
      return
    }

    this.isProcessing = true
    console.log('Starting async queue processing...')

    try {
      // Process message queue
      if (this.messageQueue.length > 0) {
        await this.processMessageQueue()
      }

      // Process warning queue
      if (this.warningQueue.length > 0) {
        await this.processWarningQueue()
      }

      console.log('Async queue processing completed')
    } catch (error) {
      console.error('Error in async queue processing:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // Process message queue in batches
  async processMessageQueue() {
    const batch = this.messageQueue.splice(0, this.batchSize)
    console.log(`Processing ${batch.length} messages from queue...`)

    try {
      const response = await fetch(
        'http://localhost:3000/api/conversations/batch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: batch,
            mongodb_url: MONGODB_URL,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log(
          `Successfully processed ${batch.length} messages. MongoDB IDs:`,
          result.ids
        )
      } else {
        // Re-queue failed messages with retry logic
        this.handleFailedBatch(batch, 'messages')
      }
    } catch (error) {
      console.error('Error processing message batch:', error)
      this.handleFailedBatch(batch, 'messages')
    }
  }

  // Process warning queue in batches
  async processWarningQueue() {
    const batch = this.warningQueue.splice(0, this.batchSize)
    console.log(`Processing ${batch.length} warnings from queue...`)

    try {
      const response = await fetch('http://localhost:3000/api/warnings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warnings: batch,
          mongodb_url: MONGODB_URL,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(
          `Successfully processed ${batch.length} warnings. MongoDB IDs:`,
          result.ids
        )
      } else {
        // Re-queue failed warnings with retry logic
        this.handleFailedBatch(batch, 'warnings')
      }
    } catch (error) {
      console.error('Error processing warning batch:', error)
      this.handleFailedBatch(batch, 'warnings')
    }
  }

  // Handle failed batches with retry logic
  handleFailedBatch(batch, type) {
    const failedItems = batch.filter((item) => {
      if (item.retryCount < this.maxRetries) {
        item.retryCount++
        item.lastRetry = new Date().toISOString()
        return true
      } else {
        console.error(`Item exceeded max retries, dropping:`, item)
        return false
      }
    })

    if (type === 'messages') {
      this.messageQueue.unshift(...failedItems)
    } else {
      this.warningQueue.unshift(...failedItems)
    }

    console.log(`Re-queued ${failedItems.length} failed ${type} for retry`)
  }

  // Get queue status
  getStatus() {
    return {
      messageQueueSize: this.messageQueue.length,
      warningQueueSize: this.warningQueue.length,
      isProcessing: this.isProcessing,
      lastProcessed: new Date().toISOString(),
    }
  }

  // Force immediate processing
  async forceProcess() {
    console.log('Force processing queues...')
    await this.processQueues()
  }
}

// Initialize the async queue
const mongoDBQueue = new AsyncMongoDBQueue()

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Bot Privacy Guard extension installed')
  chrome.storage.local.set({
    isMonitoringEnabled: true,
    botDetectionStats: botDetectionStats,
  })
})

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action, request.data)

  switch (request.action) {
    case 'botDetected':
      handleBotDetection(request.data, sender.tab?.id)
      sendResponse({ success: true })
      break

    case 'conversationMessage':
      handleConversationMessage(request.data, sender.tab?.id)
      sendResponse({ success: true })
      break

    case 'privacyWarning':
      handlePrivacyWarning(request.data, sender.tab?.id)
      sendResponse({ success: true })
      break

    case 'statusUpdate':
      handleStatusUpdate(request.data, sender.tab?.id)
      sendResponse({ success: true })
      break

    case 'toggleMonitoring':
      toggleMonitoring(request.enabled)
      sendResponse({ success: true })
      break

    case 'getStatus':
      sendResponse({
        isMonitoringEnabled: isMonitoringEnabled,
        stats: botDetectionStats,
        queueStatus: mongoDBQueue.getStatus(),
      })
      break

    case 'getBotDetails':
      sendResponse({
        bots: Array.from(detectedBots.values()),
        conversations: Array.from(conversationHistory.values()),
        warnings: privacyWarnings,
      })
      break

    case 'clearData':
      clearAllData()
      sendResponse({ success: true })
      break

    case 'getDashboardData':
      getDashboardData().then((data) => {
        sendResponse(data)
      })
      return true // Keep message channel open for async response

    case 'forceSync':
      mongoDBQueue.forceProcess().then(() => {
        sendResponse({ success: true, message: 'Forced sync completed' })
      })
      return true
  }
})

// Handle bot detection
function handleBotDetection(botData, tabId) {
  if (!isMonitoringEnabled) return

  const botId = botData.id

  // Store bot information
  detectedBots.set(botId, {
    ...botData,
    tabId,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  })

  // Update statistics
  botDetectionStats.totalBots = detectedBots.size
  botDetectionStats.lastUpdated = new Date().toISOString()

  // Store in local storage
  chrome.storage.local.set({ botDetectionStats })

  // Log bot detection
  console.log('AI Bot detected:', botData)

  // Send notification to user
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/ext.png',
      title: 'AI Bot Detected',
      message: `Found ${botData.type} bot on ${new URL(botData.url).hostname}`,
      priority: 1,
    })
  } catch (e) {
    console.log('Notification failed:', e)
  }
}

// Handle conversation messages
function handleConversationMessage(messageData, tabId) {
  if (!isMonitoringEnabled) return

  console.log('Background: Processing conversation message:', messageData)

  const botId = messageData.botId

  // Initialize conversation history for this bot if it doesn't exist
  if (!conversationHistory.has(botId)) {
    conversationHistory.set(botId, [])
  }

  // Add message to conversation history
  const conversation = conversationHistory.get(botId)
  conversation.push({
    ...messageData,
    tabId,
    timestamp: new Date().toISOString(),
  })

  // Update statistics
  botDetectionStats.totalConversations = Array.from(
    conversationHistory.values()
  ).reduce((sum, conv) => sum + conv.length, 0)
  botDetectionStats.lastUpdated = new Date().toISOString()

  // Store in local storage
  chrome.storage.local.set({ botDetectionStats })

  // Add to async MongoDB queue (non-blocking)
  mongoDBQueue.addMessage({
    ...messageData,
    tabId,
    timestamp: new Date().toISOString(),
  })

  // Analyze message for enhanced privacy risk detection using Gemini AI
  if (messageData.sender === 'bot') {
    console.log('Background: Analyzing message with AI...')
    analyzeMessageWithAI(messageData, botId)
  }
}

// Handle privacy warnings
function handlePrivacyWarning(warningData, tabId) {
  if (!isMonitoringEnabled) return

  console.log('Background: Processing privacy warning:', warningData)

  // Add warning to list
  privacyWarnings.push({
    ...warningData,
    tabId,
    timestamp: new Date().toISOString(),
  })

  // Update statistics
  botDetectionStats.totalWarnings = privacyWarnings.length
  botDetectionStats.lastUpdated = new Date().toISOString()

  // Store in local storage
  chrome.storage.local.set({ botDetectionStats })

  // Add to async MongoDB queue (non-blocking)
  mongoDBQueue.addWarning({
    ...warningData,
    tabId,
    timestamp: new Date().toISOString(),
  })

  // Send notification to user
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/ext.png',
      title: 'Privacy Risk Detected',
      message: `High risk: Bot requesting ${warningData.risks
        .map((r) => r.type.replace('_', ' '))
        .join(', ')}`,
      priority: 2,
    })
  } catch (e) {
    console.log('Notification failed:', e)
  }

  // Log warning
  console.log('Privacy warning processed and queued:', warningData)
}

// Handle status updates from content scripts
function handleStatusUpdate(statusData, tabId) {
  if (!isMonitoringEnabled) return

  // Update bot information if we have it
  if (statusData.botsDetected > 0) {
    // Update any existing bots for this tab
    for (const [botId, bot] of detectedBots.entries()) {
      if (bot.tabId === tabId) {
        bot.lastSeen = new Date().toISOString()
        bot.conversationCount = statusData.conversationsMonitored
        bot.warningCount = statusData.privacyWarnings
      }
    }
  }
}

// Store message in MongoDB
async function storeMessageInMongoDB(messageData, tabId) {
  try {
    console.log('Attempting to store message in MongoDB:', messageData)

    const messageDoc = {
      botId: messageData.botId,
      sender: messageData.sender,
      content: messageData.content,
      timestamp: new Date().toISOString(),
      url: messageData.url,
      tabId: tabId,
      website: new URL(messageData.url).hostname,
      createdAt: new Date(),
      riskLevel: messageData.riskLevel || 'none',
      detectedRisks: messageData.detectedRisks || [],
    }

    console.log('Prepared message document:', messageDoc)

    const response = await fetch('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...messageDoc,
        mongodb_url: MONGODB_URL,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        'Failed to store message in MongoDB:',
        response.status,
        errorText
      )
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    } else {
      const result = await response.json()
      console.log('Message stored in MongoDB successfully:', result)
    }
  } catch (error) {
    console.error('Error storing message in MongoDB:', error)
    // Store locally as fallback
    storeMessageLocally(messageDoc)
  }
}

// Store warning in MongoDB
async function storeWarningInMongoDB(warningData, tabId) {
  try {
    console.log('Attempting to store warning in MongoDB:', warningData)

    const warningDoc = {
      botId: warningData.botId,
      sender: warningData.sender,
      content: warningData.content,
      risks: warningData.risks,
      severity: warningData.severity,
      timestamp: new Date().toISOString(),
      url: warningData.url,
      tabId: tabId,
      website: new URL(warningData.url).hostname,
      createdAt: new Date(),
      riskLevel: determineRiskLevel(warningData.risks),
      aiAnalysis: warningData.aiAnalysis || null,
      userAction: 'warning_shown',
    }

    console.log('Prepared warning document:', warningDoc)

    const response = await fetch('http://localhost:3000/api/warnings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...warningDoc,
        mongodb_url: MONGODB_URL,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        'Failed to store warning in MongoDB:',
        response.status,
        errorText
      )
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    } else {
      const result = await response.json()
      console.log('Warning stored in MongoDB successfully:', result)
    }
  } catch (error) {
    console.error('Error storing warning in MongoDB:', error)
    // Store locally as fallback
    storeWarningLocally(warningDoc)
  }
}

// Determine risk level based on risks
function determineRiskLevel(risks) {
  if (!risks || risks.length === 0) return 'none'

  const highRiskTypes = [
    'ssn',
    'credit_card',
    'bank_account',
    'passport',
    'drivers_license',
  ]
  const mediumRiskTypes = [
    'phone_number',
    'address',
    'id_document',
    'email',
    'birth_date',
  ]

  if (risks.some((risk) => highRiskTypes.includes(risk.type))) {
    return 'very_high'
  } else if (risks.some((risk) => mediumRiskTypes.includes(risk.type))) {
    return 'high'
  } else {
    return 'medium'
  }
}

// Local fallback storage
function storeMessageLocally(messageDoc) {
  try {
    const localMessages = JSON.parse(
      localStorage.getItem('localMessages') || '[]'
    )
    localMessages.push(messageDoc)
    localStorage.setItem('localMessages', JSON.stringify(localMessages))
    console.log('Message stored locally as fallback')
  } catch (e) {
    console.error('Failed to store message locally:', e)
  }
}

function storeWarningLocally(warningDoc) {
  try {
    const localWarnings = JSON.parse(
      localStorage.getItem('localWarnings') || '[]'
    )
    localWarnings.push(warningDoc)
    localStorage.setItem('localWarnings', JSON.stringify(localWarnings))
    console.log('Warning stored locally as fallback')
  } catch (e) {
    console.error('Failed to store warning locally:', e)
  }
}

// Get dashboard data
async function getDashboardData() {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mongodb_url: MONGODB_URL,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        data: data,
        localStats: {
          bots: Array.from(detectedBots.values()),
          conversations: Array.from(conversationHistory.values()),
          warnings: privacyWarnings,
        },
      }
    } else {
      return {
        success: false,
        error: 'Failed to fetch dashboard data',
        localStats: {
          bots: Array.from(detectedBots.values()),
          conversations: Array.from(conversationHistory.values()),
          warnings: privacyWarnings,
        },
      }
    }
  } catch (error) {
    console.log('Error fetching dashboard data:', error)
    return {
      success: false,
      error: error.message,
      localStats: {
        bots: Array.from(detectedBots.values()),
        conversations: Array.from(conversationHistory.values()),
        warnings: privacyWarnings,
      },
    }
  }
}

// Analyze message with Gemini AI for enhanced detection
async function analyzeMessageWithAI(messageData, botId) {
  try {
    const prompt = `Analyze this AI bot message for potential privacy risks.
    Message: "${messageData.content}"

    Look for:
    1. Requests for personal information
    2. Financial information requests
    3. Identity document requests
    4. Sensitive data collection
    5. Social engineering attempts

    Respond with JSON format:
    {
      "risk_level": "low|medium|high",
      "risks": ["risk_type1", "risk_type2"],
      "explanation": "brief explanation",
      "recommendation": "what user should do"
    }`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    if (response.ok) {
      const result = await response.json()
      const aiAnalysis = result.candidates[0].content.parts[0].text

      try {
        const analysis = JSON.parse(aiAnalysis)

        // If AI detects additional risks, create enhanced warning
        if (
          analysis.risk_level === 'high' ||
          analysis.risk_level === 'medium'
        ) {
          const enhancedWarning = {
            botId,
            sender: 'ai_analysis',
            content: messageData.content,
            risks: analysis.risks.map((risk) => ({
              type: risk,
              source: 'ai_analysis',
              confidence: 'high',
            })),
            severity: analysis.risk_level,
            explanation: analysis.explanation,
            recommendation: analysis.recommendation,
            timestamp: new Date().toISOString(),
            url: messageData.url,
            aiAnalysis: analysis, // Store AI analysis for enhanced warnings
          }

          // Add to warnings
          privacyWarnings.push(enhancedWarning)
          botDetectionStats.totalWarnings = privacyWarnings.length

          // Store updated stats
          chrome.storage.local.set({ botDetectionStats })

          // Store enhanced warning in MongoDB
          storeWarningInMongoDB(enhancedWarning, messageData.tabId)

          // Send enhanced notification
          try {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/ext.png',
              title: 'AI-Enhanced Privacy Warning',
              message: `AI detected: ${analysis.explanation}`,
              priority: 2,
            })
          } catch (e) {
            console.log('Enhanced notification failed:', e)
          }
        }
      } catch (parseError) {
        console.log('AI response parsing failed:', parseError)
      }
    }
  } catch (error) {
    console.log('AI analysis failed:', error)
  }
}

// Toggle monitoring on/off
function toggleMonitoring(enabled) {
  isMonitoringEnabled = enabled
  chrome.storage.local.set({ isMonitoringEnabled })

  if (enabled) {
    console.log('AI Bot monitoring enabled')
  } else {
    console.log('AI Bot monitoring disabled')
  }
}

// Clear all stored data
function clearAllData() {
  detectedBots.clear()
  conversationHistory.clear()
  privacyWarnings = []
  botDetectionStats = {
    totalBots: 0,
    totalConversations: 0,
    totalWarnings: 0,
    lastUpdated: new Date().toISOString(),
  }

  chrome.storage.local.clear()
  console.log('All data cleared')
}

// Handle tab updates to clean up data when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Remove bots associated with this tab
  for (const [botId, bot] of detectedBots.entries()) {
    if (bot.tabId === tabId) {
      detectedBots.delete(botId)
    }
  }

  // Remove conversations associated with this tab
  for (const [botId, conversation] of conversationHistory.entries()) {
    if (conversation.length > 0 && conversation[0].tabId === tabId) {
      conversationHistory.delete(botId)
    }
  }

  // Update statistics
  botDetectionStats.totalBots = detectedBots.size
  botDetectionStats.totalConversations = Array.from(
    conversationHistory.values()
  ).reduce((sum, conv) => sum + conv.length, 0)
  botDetectionStats.lastUpdated = new Date().toISOString()

  chrome.storage.local.set({ botDetectionStats })
})

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('AI Bot Privacy Guard started')

  // Load saved state
  chrome.storage.local.get(
    ['isMonitoringEnabled', 'botDetectionStats'],
    (result) => {
      if (result.isMonitoringEnabled !== undefined) {
        isMonitoringEnabled = result.isMonitoringEnabled
      }
      if (result.botDetectionStats) {
        botDetectionStats = result.botDetectionStats
      }
    }
  )
})

// Periodic cleanup and maintenance
setInterval(() => {
  const now = new Date()

  // Clean up old warnings (older than 24 hours)
  privacyWarnings = privacyWarnings.filter((warning) => {
    const warningTime = new Date(warning.timestamp)
    return now - warningTime < 24 * 60 * 60 * 1000
  })

  // Update statistics
  botDetectionStats.totalWarnings = privacyWarnings.length
  botDetectionStats.lastUpdated = now.toISOString()

  // Store updated stats
  chrome.storage.local.set({ botDetectionStats })
}, 60 * 60 * 1000) // Every hour

// Sync local data with MongoDB when server becomes available
async function syncLocalDataWithMongoDB() {
  try {
    // Check if server is available
    const healthResponse = await fetch('http://localhost:3000/health')
    if (!healthResponse.ok) {
      console.log('MongoDB server not available, skipping sync')
      return
    }

    console.log('MongoDB server available, syncing local data...')

    // Sync local messages
    const localMessages = JSON.parse(
      localStorage.getItem('localMessages') || '[]'
    )
    if (localMessages.length > 0) {
      console.log(`Syncing ${localMessages.length} local messages...`)

      for (const message of localMessages) {
        try {
          const response = await fetch(
            'http://localhost:3000/api/conversations',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...message,
                mongodb_url: MONGODB_URL,
                synced: true,
              }),
            }
          )

          if (response.ok) {
            console.log('Local message synced successfully:', message.id)
          }
        } catch (e) {
          console.error('Failed to sync local message:', e)
        }
      }

      // Clear synced messages
      localStorage.removeItem('localMessages')
      console.log('Local messages synced and cleared')
    }

    // Sync local warnings
    const localWarnings = JSON.parse(
      localStorage.getItem('localWarnings') || '[]'
    )
    if (localWarnings.length > 0) {
      console.log(`Syncing ${localWarnings.length} local warnings...`)

      for (const warning of localWarnings) {
        try {
          const response = await fetch('http://localhost:3000/api/warnings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...warning,
              mongodb_url: MONGODB_URL,
              synced: true,
            }),
          })

          if (response.ok) {
            console.log('Local warning synced successfully:', warning.id)
          }
        } catch (e) {
          console.error('Failed to sync local warning:', e)
        }
      }

      // Clear synced warnings
      localStorage.removeItem('localWarnings')
      console.log('Local warnings synced and cleared')
    }
  } catch (error) {
    console.log('Error syncing local data:', error)
  }
}

// Try to sync data every 30 seconds
setInterval(syncLocalDataWithMongoDB, 30000)

// Also try to sync when the extension starts
chrome.runtime.onStartup.addListener(() => {
  setTimeout(syncLocalDataWithMongoDB, 5000) // Wait 5 seconds after startup
})

console.log('AI Bot Privacy Guard background script loaded')
