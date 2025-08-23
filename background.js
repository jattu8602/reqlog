// AI Bot Privacy Guard Background Service Worker
const GEMINI_API_KEY = 'AIzaSyC0P9KY3lAjFTy73kHTFJ34VC8HoSJgy-Y'
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

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
  switch (request.action) {
    case 'botDetected':
      handleBotDetection(request.data, sender.tab?.id)
      break

    case 'conversationMessage':
      handleConversationMessage(request.data, sender.tab?.id)
      break

    case 'privacyWarning':
      handlePrivacyWarning(request.data, sender.tab?.id)
      break

    case 'statusUpdate':
      handleStatusUpdate(request.data, sender.tab?.id)
      break

    case 'toggleMonitoring':
      toggleMonitoring(request.enabled)
      sendResponse({ success: true })
      break

    case 'getStatus':
      sendResponse({
        isMonitoringEnabled: isMonitoringEnabled,
        stats: botDetectionStats,
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
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/ext.png',
    title: 'AI Bot Detected',
    message: `Found ${botData.type} bot on ${new URL(botData.url).hostname}`,
    priority: 1,
  })
}

// Handle conversation messages
function handleConversationMessage(messageData, tabId) {
  if (!isMonitoringEnabled) return

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
  botDetectionStats.totalConversations = conversationHistory.size
  botDetectionStats.lastUpdated = new Date().toISOString()

  // Store in local storage
  chrome.storage.local.set({ botDetectionStats })

  // Analyze message for enhanced privacy risk detection using Gemini AI
  if (messageData.sender === 'bot') {
    analyzeMessageWithAI(messageData, botId)
  }
}

// Handle privacy warnings
function handlePrivacyWarning(warningData, tabId) {
  if (!isMonitoringEnabled) return

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

  // Send notification to user
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/ext.png',
    title: 'Privacy Risk Detected',
    message: `High risk: Bot requesting ${warningData.risks
      .map((r) => r.type.replace('_', ' '))
      .join(', ')}`,
    priority: 2,
  })

  // Log warning
  console.log('Privacy warning:', warningData)
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
          }

          // Add to warnings
          privacyWarnings.push(enhancedWarning)
          botDetectionStats.totalWarnings = privacyWarnings.length

          // Store updated stats
          chrome.storage.local.set({ botDetectionStats })

          // Send enhanced notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/ext.png',
            title: 'AI-Enhanced Privacy Warning',
            message: `AI detected: ${analysis.explanation}`,
            priority: 2,
          })
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
  botDetectionStats.totalConversations = conversationHistory.size
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

console.log('AI Bot Privacy Guard background script loaded')
