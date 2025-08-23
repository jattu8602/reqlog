// Background service worker for capturing network requests
const API_ENDPOINT = 'http://localhost:3000/api/logs' // Local testing endpoint
const MONGODB_URL =
  'mongodb+srv://reqlog:reqlog@reqlog.fvlzk2o.mongodb.net/reqlog?retryWrites=true&w=majority&appName=reqlog'

// Store captured requests
let capturedRequests = new Map()
let isLoggingEnabled = true

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Request Logger extension installed')
  chrome.storage.local.set({ isLoggingEnabled: true })
})

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleLogging') {
    isLoggingEnabled = request.enabled
    chrome.storage.local.set({ isLoggingEnabled: isLoggingEnabled })
    sendResponse({ success: true })
  } else if (request.action === 'getStatus') {
    sendResponse({ isLoggingEnabled })
  } else if (request.action === 'getStats') {
    sendResponse({
      totalRequests: capturedRequests.size,
      isLoggingEnabled,
    })
  }
})

// Capture request details
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isLoggingEnabled) return

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
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
)

// Capture response details
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!isLoggingEnabled) return

    const requestData = capturedRequests.get(details.requestId)
    if (requestData) {
      const logEntry = {
        ...requestData,
        status_code: details.statusCode,
        response_headers: details.responseHeaders,
        response_size_bytes: details.responseSize || 0,
        latency_ms: Date.now() - new Date(requestData.timestamp).getTime(),
        protocol: details.url.split(':')[0],
        ip_address: details.ip || 'unknown',
        error: details.statusCode >= 400 ? `HTTP ${details.statusCode}` : null,
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

// Capture error details
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (!isLoggingEnabled) return

    const requestData = capturedRequests.get(details.requestId)
    if (requestData) {
      const logEntry = {
        ...requestData,
        status_code: 0,
        error: details.error,
        response_size_bytes: 0,
        latency_ms: Date.now() - new Date(requestData.timestamp).getTime(),
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
      console.error('Failed to send log to API:', response.status)
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
