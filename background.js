// Background service worker for AI Bot Privacy Guard & Request Logger
const API_ENDPOINT = 'http://localhost:3000/api/logs' // Local testing endpoint
const MONGODB_URL =
  'mongodb+srv://reqlog:reqlog@reqlog.fvlzk2o.mongodb.net/reqlog?retryWrites=true&w=majority&appName=reqlog'

// Store captured requests
let capturedRequests = new Map()
let isLoggingEnabled = true
let isAIMonitoringEnabled = true

// AI Bot Privacy Guard state
let detectedBots = new Map()
let conversationHistory = new Map()
let privacyWarnings = []

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Bot Privacy Guard & Request Logger extension installed')
  chrome.storage.local.set({ isLoggingEnabled: true })
})

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request)

  // Request Logger functionality
  if (request.action === 'toggleLogging') {
    isLoggingEnabled = request.enabled
    chrome.storage.local.set({ isLoggingEnabled: isLoggingEnabled })
    console.log('Logging toggled:', isLoggingEnabled)
    sendResponse({ success: true })
  } else if (request.action === 'toggleAIMonitoring') {
    isAIMonitoringEnabled = request.enabled
    chrome.storage.local.set({ isAIMonitoringEnabled: isAIMonitoringEnabled })
    console.log('AI Monitoring toggled:', isAIMonitoringEnabled)
    sendResponse({ success: true })
  } else if (request.action === 'getStatus') {
    sendResponse({
      isLoggingEnabled,
      isAIMonitoringEnabled,
    })
  } else if (request.action === 'getStats') {
    sendResponse({
      isLoggingEnabled,
      totalRequests: capturedRequests.size,
      totalBots: detectedBots.size,
      totalConversations: Array.from(conversationHistory.values()).reduce(
        (sum, conv) => sum + conv.length,
        0
      ),
      totalWarnings: privacyWarnings.length,
    })
  } else if (request.action === 'pageInfo') {
    // Handle page info from content script
    console.log('Page info received:', request.data)
    if (isLoggingEnabled) {
      sendToAPI({
        type: 'pageInfo',
        ...request.data,
        timestamp: new Date().toISOString(),
        source: 'content_script',
      })
    }
    sendResponse({ success: true })
  } else if (request.action === 'formSubmission') {
    // Handle form submission from content script
    console.log('Form submission captured:', request.data)
    if (isLoggingEnabled) {
      sendToAPI({
        type: 'formSubmission',
        ...request.data,
        timestamp: new Date().toISOString(),
        source: 'content_script',
      })
    }
    sendResponse({ success: true })
  } else if (request.action === 'xhrRequest') {
    // Handle XHR request from content script
    console.log('XHR request captured:', request.data)
    if (isLoggingEnabled) {
      sendToAPI({
        type: 'xhrRequest',
        ...request.data,
        timestamp: new Date().toISOString(),
        source: 'content_script',
      })
    }
    sendResponse({ success: true })
  } else if (request.action === 'fetchRequest') {
    // Handle fetch request from content script
    console.log('Fetch request captured:', request.data)
    if (isLoggingEnabled) {
      sendToAPI({
        type: 'fetchRequest',
        ...request.data,
        timestamp: new Date().toISOString(),
        source: 'content_script',
      })
    }
    sendResponse({ success: true })
  }

  // AI Bot Privacy Guard functionality
  else if (request.action === 'botDetected') {
    console.log('Bot detected:', request.data)
    const botId = request.data.id
    detectedBots.set(botId, {
      ...request.data,
      firstSeen: request.data.timestamp,
      lastSeen: request.data.timestamp,
    })

    // Send bot detection to API
    if (isLoggingEnabled) {
      sendToAPI({
        type: 'botDetected',
        ...request.data,
        timestamp: new Date().toISOString(),
        source: 'ai_bot_detection',
      })
    }

    sendResponse({ success: true })
  } else if (request.action === 'conversationMessage') {
    console.log('Conversation message:', request.data)
    const botId = request.data.botId

    if (!conversationHistory.has(botId)) {
      conversationHistory.set(botId, [])
    }
    conversationHistory.get(botId).push(request.data)

    // Send conversation message to API
    if (isLoggingEnabled) {
      sendToAPI({
        type: 'conversationMessage',
        ...request.data,
        timestamp: new Date().toISOString(),
        source: 'ai_bot_detection',
      })
    }

    sendResponse({ success: true })
  } else if (request.action === 'privacyWarning') {
    console.log('Privacy warning:', request.data)
    privacyWarnings.push(request.data)

    // Send privacy warning to API
    if (isLoggingEnabled) {
      sendToAPI({
        type: 'privacyWarning',
        ...request.data,
        timestamp: new Date().toISOString(),
        source: 'ai_bot_detection',
      })
    }

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/ext.png',
      title: '⚠️ Privacy Warning',
      message: `AI bot requesting: ${request.data.risks
        ?.map((r) => r.type.replace('_', ' '))
        .join(', ')}`,
    })

    sendResponse({ success: true })
  } else if (request.action === 'statusUpdate') {
    console.log('Status update:', request.data)
    sendResponse({ success: true })
  } else if (request.action === 'getDashboardData') {
    // Return dashboard data for popup
    const localStats = {
      bots: Array.from(detectedBots.values()),
      conversations: Array.from(conversationHistory.values()),
      warnings: privacyWarnings,
    }
    sendResponse({ success: true, localStats })
  } else if (request.action === 'getBotDetails') {
    // Return bot details for popup
    const data = {
      bots: Array.from(detectedBots.values()),
      warnings: privacyWarnings,
    }
    sendResponse(data)
  } else if (request.action === 'clearData') {
    // Clear all stored data
    detectedBots.clear()
    conversationHistory.clear()
    privacyWarnings.length = 0
    capturedRequests.clear()
    sendResponse({ success: true })
  }

  return true // Keep message channel open for async response
})

// Capture request details (Request Logger functionality)
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isLoggingEnabled) return

    console.log('Capturing request:', details.url, details.method)

    const requestData = {
      timestamp: new Date().toISOString(),
      url: details.url,
      method: details.method,
      type: details.type,
      requestId: details.requestId,
      tabId: details.tabId,
      frameId: details.frameId,
      parentFrameId: details.parentFrameId,
      requestBody: details.requestBody,
      requestSize: details.requestBody
        ? JSON.stringify(details.requestBody).length
        : 0,
    }

    capturedRequests.set(details.requestId, requestData)
    console.log('Request stored, total:', capturedRequests.size)
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
)

// Capture response details (Request Logger functionality)
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!isLoggingEnabled) return

    const requestData = capturedRequests.get(details.requestId)
    if (requestData) {
      console.log('Request completed:', details.url, details.statusCode)

      const logEntry = {
        ...requestData,
        status_code: details.statusCode,
        response_headers: details.responseHeaders,
        response_size_bytes: details.responseSize || 0,
        latency_ms: Date.now() - new Date(requestData.timestamp).getTime(),
        protocol: details.url.split(':')[0],
        ip_address: details.ip || 'unknown',
        error: details.statusCode >= 400 ? `HTTP ${details.statusCode}` : null,
        type: 'network_request',
        source: 'webRequest_api',
      }

      // Send to API
      sendToAPI(logEntry)

      // Clean up
      capturedRequests.delete(details.requestId)
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
)

// Capture error details (Request Logger functionality)
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (!isLoggingEnabled) return

    const requestData = capturedRequests.get(details.requestId)
    if (requestData) {
      console.log('Request error:', details.url, details.error)

      const logEntry = {
        ...requestData,
        status_code: 0,
        error: details.error,
        response_size_bytes: 0,
        latency_ms: Date.now() - new Date(requestData.timestamp).getTime(),
        type: 'network_request_error',
        source: 'webRequest_api',
      }

      // Send to API
      sendToAPI(logEntry)

      // Clean up
      capturedRequests.delete(details.requestId)
    }
  },
  { urls: ['<all_urls>'] }
)

// Function to send data to API
async function sendToAPI(logEntry) {
  try {
    console.log(
      'Sending log to API:',
      logEntry.type || logEntry.url,
      logEntry.method || 'N/A'
    )

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...logEntry,
        mongodb_url: MONGODB_URL,
      }),
    })

    if (!response.ok) {
      console.error(
        'Failed to send log to API:',
        response.status,
        response.statusText
      )
    } else {
      console.log('Log sent successfully to API')
    }
  } catch (error) {
    console.error('Error sending log to API:', error)
  }
}

// Clean up old requests periodically
setInterval(() => {
  const now = Date.now()
  for (const [requestId, requestData] of capturedRequests.entries()) {
    const requestTime = new Date(requestData.timestamp).getTime()
    if (now - requestTime > 300000) {
      // 5 minutes
      capturedRequests.delete(requestId)
    }
  }
}, 60000) // Check every minute
