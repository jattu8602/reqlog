// Add these handlers to your existing background.js file
// This ensures the popup.js works correctly with your extension

// Store for logs (in memory)
let allLogs = [];
let isLoggingEnabled = true;
let totalRequestCount = 0;

// Example log structure
// const logEntry = {
//   url: 'https://api.example.com/data',
//   method: 'GET',
//   timestamp: Date.now(),
//   tabId: 123,
//   requestId: 'abc123'
// };

// Add this to your existing message listener in background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'getStatus':
      // Return current logging status
      sendResponse({ isLoggingEnabled: isLoggingEnabled });
      break;
      
    case 'getStats':
      // Return total request count
      sendResponse({ totalRequests: totalRequestCount });
      break;
      
    case 'toggleLogging':
      // Toggle logging on/off
      isLoggingEnabled = request.enabled;
      sendResponse({ success: true });
      break;
      
    case 'getLatestLogs':
      // Return only the specified number of latest logs
      const limit = request.limit || 2;
      const latestLogs = allLogs.slice(-limit).reverse(); // Get last N logs, newest first
      sendResponse({ logs: latestLogs });
      break;
      
    case 'getLogs':
      // Fallback: return all logs (popup will filter to show only 2)
      sendResponse({ logs: allLogs });
      break;
      
    case 'getVulnerabilityStatus':
      // Analyze logs for suspicious patterns
      const status = analyzeSecurityStatus();
      sendResponse({ status: status });
      break;
      
    case 'getUserSubscription':
      // Get user subscription type (you can integrate with your backend)
      chrome.storage.sync.get(['userType'], (result) => {
        sendResponse({ userType: result.userType || 'free' });
      });
      return true; // Will respond asynchronously
      
    case 'popupClosed':
      // Handle popup close if needed
      console.log('Popup closed');
      break;
  }
  
  // Return true if you want to send response asynchronously
  if (request.action === 'getUserSubscription') {
    return true;
  }
});

// Function to analyze security status based on logs
function analyzeSecurityStatus() {
  if (allLogs.length === 0) {
    return 'all-good';
  }
  
  // Simple analysis - you can make this more sophisticated
  const suspiciousPatterns = [
    /eval\(/i,
    /document\.write/i,
    /innerHTML/i,
    /<script>/i,
    /javascript:/i,
    /data:text\/html/i
  ];
  
  const recentLogs = allLogs.slice(-50); // Check last 50 logs
  let suspiciousCount = 0;
  
  for (const log of recentLogs) {
    const url = log.url || '';
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        suspiciousCount++;
        break;
      }
    }
  }
  
  // Determine status based on suspicious activity
  if (suspiciousCount > 10) {
    return 'vulnerable';
  } else if (suspiciousCount > 3) {
    return 'suspicious';
  }
  
  return 'all-good';
}

// Function to log a new request (call this when intercepting requests)
function logRequest(details) {
  if (!isLoggingEnabled) return;
  
  const logEntry = {
    url: details.url,
    method: details.method || 'GET',
    timestamp: Date.now(),
    tabId: details.tabId,
    requestId: details.requestId
  };
  
  // Add to logs array
  allLogs.push(logEntry);
  
  // Keep only last 1000 logs to prevent memory issues
  if (allLogs.length > 1000) {
    allLogs = allLogs.slice(-1000);
  }
  
  // Increment counter
  totalRequestCount++;
  
  // Send update to popup if it's open
  chrome.runtime.sendMessage({
    action: 'newLogEntry',
    log: logEntry
  }).catch(() => {
    // Popup is not open, ignore error
  });
}

// Example: Hook into web requests to log them
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // Only log requests from active tabs, not extension requests
    if (details.tabId > 0 && !details.url.startsWith('chrome-extension://')) {
      logRequest(details);
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Initialize user type on install
chrome.runtime.onInstalled.addListener(() => {
  // Set default user type
  chrome.storage.sync.set({ userType: 'free' });
});

// Example function to update user type (call this after authentication)
function updateUserType(newType) {
  chrome.storage.sync.set({ userType: newType }, () => {
    // Notify popup if it's open
    chrome.runtime.sendMessage({
      action: 'userTypeUpdate',
      userType: newType
    }).catch(() => {
      // Popup is not open, ignore
    });
  });
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    logRequest,
    updateUserType,
    analyzeSecurityStatus
  };
}