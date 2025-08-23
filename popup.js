// Popup script for handling user interactions
document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const loggingToggle = document.getElementById('loggingToggle')
  const statusIndicator = document.getElementById('statusIndicator')
  const totalRequests = document.getElementById('totalRequests')
  const logsContainer = document.getElementById('logsContainer')
  const bodyElement = document.getElementById('bodyElement')
  const vulnerabilityText = document.getElementById('vulnerabilityText')
  const shieldIcon = document.getElementById('shieldIcon')
  const userType = document.getElementById('userType')
  const dashboardSection = document.getElementById('dashboardSection')
  const dashboardBtn = document.getElementById('dashboardBtn')

  // State
  let latestLogs = []
  let currentUserType = 'free' // 'free', 'premium', 'premium-plus'
  let vulnerabilityStatus = 'all-good' // 'all-good', 'suspicious', 'vulnerable'

  // Initialize
  init()

  function init() {
    loadStatus()
    loadStats()
    loadLatestLogs()
    loadUserSettings()
    loadVulnerabilityStatus()
    setupEventListeners()
    startAutoRefresh()
  }

  // Set up event listeners
  function setupEventListeners() {
    loggingToggle.addEventListener('change', function () {
      const isEnabled = this.checked
      toggleLogging(isEnabled)
    })

    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', openDashboard)
    }
  }

  // Load current logging status
  function loadStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function (response) {
      if (chrome.runtime.lastError) {
        console.error('Error loading status:', chrome.runtime.lastError)
        return
      }
      
      if (response && response.isLoggingEnabled !== undefined) {
        loggingToggle.checked = response.isLoggingEnabled
        updateStatusIndicator(response.isLoggingEnabled)
      }
    })
  }

  // Load statistics
  function loadStats() {
    chrome.runtime.sendMessage({ action: 'getStats' }, function (response) {
      if (chrome.runtime.lastError) {
        console.error('Error loading stats:', chrome.runtime.lastError)
        return
      }
      
      if (response) {
        totalRequests.textContent = response.totalRequests || 0
      }
    })
  }

  // Load latest logs (only 2 most recent)
  function loadLatestLogs() {
    // First try to get latest logs if your background script supports it
    chrome.runtime.sendMessage({ action: 'getLatestLogs', limit: 2 }, function (response) {
      if (chrome.runtime.lastError) {
        // Fallback: Try to get all logs and take only the latest 2
        chrome.runtime.sendMessage({ action: 'getLogs' }, function (fallbackResponse) {
          if (fallbackResponse && fallbackResponse.logs) {
            // Take only the 2 most recent logs
            latestLogs = fallbackResponse.logs.slice(-2).reverse()
            displayLogs(latestLogs)
          } else {
            // If no logs available, show empty state
            displayLogs([])
          }
        })
        return
      }
      
      if (response && response.logs) {
        // Ensure we only show 2 logs maximum
        latestLogs = response.logs.slice(0, 2)
        displayLogs(latestLogs)
      }
    })
  }

  // Load user settings (type, subscription status)
  function loadUserSettings() {
    chrome.storage.sync.get(['userType'], function (result) {
      if (result.userType) {
        currentUserType = result.userType
        updateUserType(currentUserType)
      } else {
        // Default to free if not set
        checkUserSubscription()
      }
    })
  }

  // Check user subscription status (you can integrate with your backend)
  function checkUserSubscription() {
    // This would typically make an API call to your backend
    // For now, we'll use chrome.storage
    chrome.runtime.sendMessage({ action: 'getUserSubscription' }, function (response) {
      if (response && response.userType) {
        currentUserType = response.userType
        updateUserType(currentUserType)
        
        // Save to storage
        chrome.storage.sync.set({ userType: currentUserType })
      }
    })
  }

  // Load vulnerability status (simplified version that works)
  function loadVulnerabilityStatus() {
    // Try to get vulnerability status from background
    chrome.runtime.sendMessage({ action: 'getVulnerabilityStatus' }, function (response) {
      if (chrome.runtime.lastError || !response) {
        // Default to "all-good" if not implemented
        updateVulnerabilityStatus('all-good')
        return
      }
      
      if (response && response.status) {
        vulnerabilityStatus = response.status
        updateVulnerabilityStatus(vulnerabilityStatus)
      }
    })
  }

  // Simple vulnerability analysis based on request count and patterns
  function analyzeVulnerability() {
    // This is a simple implementation - you can enhance it
    chrome.runtime.sendMessage({ action: 'getStats' }, function (response) {
      if (response && response.totalRequests) {
        const count = response.totalRequests
        // Simple logic: you can make this more sophisticated
        if (count > 100) {
          updateVulnerabilityStatus('suspicious')
        } else if (count > 500) {
          updateVulnerabilityStatus('vulnerable')
        } else {
          updateVulnerabilityStatus('all-good')
        }
      }
    })
  }

  // Toggle logging on/off
  function toggleLogging(enabled) {
    chrome.runtime.sendMessage(
      {
        action: 'toggleLogging',
        enabled: enabled,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error('Error toggling logging:', chrome.runtime.lastError)
          // Revert toggle on error
          loggingToggle.checked = !enabled
          return
        }
        
        if (response && response.success) {
          updateStatusIndicator(enabled)
          // Refresh stats and logs after toggle
          setTimeout(() => {
            loadStats()
            loadLatestLogs()
          }, 500)
        }
      }
    )
  }

  // Update status indicator
  function updateStatusIndicator(isEnabled) {
    if (isEnabled) {
      statusIndicator.classList.add('active')
      statusIndicator.classList.remove('inactive')
    } else {
      statusIndicator.classList.remove('active')
      statusIndicator.classList.add('inactive')
    }
  }

  // Update vulnerability status UI
  function updateVulnerabilityStatus(status) {
    // Remove all status classes
    bodyElement.classList.remove('all-good', 'suspicious', 'vulnerable')
    
    switch(status) {
      case 'all-good':
        bodyElement.classList.add('all-good')
        vulnerabilityText.textContent = 'All Good'
        shieldIcon.textContent = '🛡️'
        break
      case 'suspicious':
        bodyElement.classList.add('suspicious')
        vulnerabilityText.textContent = 'Suspicious'
        shieldIcon.textContent = '⚠️'
        break
      case 'vulnerable':
        bodyElement.classList.add('vulnerable')
        vulnerabilityText.textContent = 'Vulnerable'
        shieldIcon.textContent = '🚨'
        break
      default:
        bodyElement.classList.add('all-good')
        vulnerabilityText.textContent = 'All Good'
        shieldIcon.textContent = '🛡️'
    }
  }

  // Update user type UI
  function updateUserType(type) {
    userType.classList.remove('free', 'premium', 'premium-plus')
    
    switch(type) {
      case 'premium':
        userType.classList.add('premium')
        userType.textContent = 'Premium'
        dashboardSection.style.display = 'block'
        break
      case 'premium-plus':
        userType.classList.add('premium-plus')
        userType.textContent = 'Premium Plus'
        dashboardSection.style.display = 'block'
        break
      default:
        userType.classList.add('free')
        userType.textContent = 'Free'
        dashboardSection.style.display = 'none'
    }
  }

  // Display logs in the UI
  function displayLogs(logs) {
    if (!logs || logs.length === 0) {
      logsContainer.innerHTML = '<div class="empty-logs">No requests logged yet</div>'
      return
    }
    
    const logsHTML = logs.map(log => {
      const time = formatTime(log.timestamp || Date.now())
      const method = log.method || 'GET'
      const url = log.url || 'Unknown URL'
      
      return `
        <div class="log-item">
          <div class="log-time">${time}</div>
          <div class="log-url">
            <span class="log-method ${method}">${method}</span>
            <span title="${url}">${truncateUrl(url)}</span>
          </div>
        </div>
      `
    }).join('')
    
    logsContainer.innerHTML = logsHTML
  }

  // Format timestamp to readable time
  function formatTime(timestamp) {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes
    return `${displayHours}:${displayMinutes} ${ampm}`
  }

  // Truncate long URLs for display
  function truncateUrl(url) {
    if (url.length <= 50) return url
    
    try {
      const urlObj = new URL(url)
      const pathAndQuery = urlObj.pathname + urlObj.search
      if (pathAndQuery.length > 30) {
        return urlObj.hostname + pathAndQuery.substring(0, 27) + '...'
      }
      return urlObj.hostname + pathAndQuery
    } catch {
      return url.substring(0, 47) + '...'
    }
  }

  // Open dashboard in new tab
  function openDashboard() {
    chrome.tabs.create({ 
      url: chrome.runtime.getURL('dashboard.html')
    })
  }

  // Auto-refresh functionality
  function startAutoRefresh() {
    // Refresh stats every 5 seconds
    setInterval(() => {
      loadStats()
      loadLatestLogs()
    }, 5000)
    
    // Check vulnerability status every 30 seconds
    setInterval(() => {
      loadVulnerabilityStatus()
    }, 30000)
  }

  // Listen for real-time updates from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'newLogEntry') {
      // Add new log to the beginning of the array
      latestLogs.unshift(request.log)
      // Keep only the 2 most recent logs - THIS IS IMPORTANT
      latestLogs = latestLogs.slice(0, 2)
      displayLogs(latestLogs)
      
      // Update stats
      const currentCount = parseInt(totalRequests.textContent) || 0
      totalRequests.textContent = currentCount + 1
      
      // Re-analyze vulnerability after new logs
      if (currentCount % 50 === 0) { // Check every 50 requests
        analyzeVulnerability()
      }
    } else if (request.action === 'vulnerabilityUpdate') {
      updateVulnerabilityStatus(request.status)
    } else if (request.action === 'userTypeUpdate') {
      updateUserType(request.userType)
    }
  })

  // Handle extension unload/reload gracefully
  window.addEventListener('unload', function() {
    // Clean up any pending operations
    chrome.runtime.sendMessage({ action: 'popupClosed' })
  })
})