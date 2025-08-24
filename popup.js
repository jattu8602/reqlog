// AI Bot Privacy Guard & Request Logger Popup Script
document.addEventListener('DOMContentLoaded', function () {
  const aiMonitoringToggle = document.getElementById('aiMonitoringToggle')
  const loggingToggle = document.getElementById('loggingToggle')
  const statusText = document.getElementById('statusText')
  const botsDetected = document.getElementById('botsDetected')
  const conversations = document.getElementById('conversations')
  const privacyWarnings = document.getElementById('privacyWarnings')
  const networkRequests = document.getElementById('networkRequests')
  const lastUpdated = document.getElementById('lastUpdated')
  const aiStatus = document.getElementById('aiStatus')
  const loggingStatus = document.getElementById('loggingStatus')
  const viewDashboardBtn = document.getElementById('viewDashboard')
  const viewDetailsBtn = document.getElementById('viewDetails')
  const clearDataBtn = document.getElementById('clearData')
  const dashboard = document.getElementById('dashboard')

  // Load initial state
  loadStatus()
  loadStats()

  // Set up event listeners
  aiMonitoringToggle.addEventListener('change', function () {
    const isEnabled = this.checked
    toggleAIMonitoring(isEnabled)
  })

  loggingToggle.addEventListener('change', function () {
    const isEnabled = this.checked
    toggleLogging(isEnabled)
  })

  viewDashboardBtn.addEventListener('click', function () {
    toggleDashboard()
  })

  viewDetailsBtn.addEventListener('click', function () {
    viewBotDetails()
  })

  clearDataBtn.addEventListener('click', function () {
    if (
      confirm('Are you sure you want to clear all data? This cannot be undone.')
    ) {
      clearAllData()
    }
  })

  // Load current monitoring status
  function loadStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function (response) {
      if (response) {
        if (response.isLoggingEnabled !== undefined) {
          loggingToggle.checked = response.isLoggingEnabled
          updateStatusText(response.isLoggingEnabled)
          updateLoggingStatus(response.isLoggingEnabled)
        }
        if (response.isAIMonitoringEnabled !== undefined) {
          aiMonitoringToggle.checked = response.isAIMonitoringEnabled
          updateAIStatus(response.isAIMonitoringEnabled)
        }
      }
    })
  }

  // Load statistics
  function loadStats() {
    chrome.runtime.sendMessage({ action: 'getStats' }, function (response) {
      if (response && response.isLoggingEnabled !== undefined) {
        const stats = response

        // Update statistics
        botsDetected.textContent = stats.totalBots || 0
        conversations.textContent = stats.totalConversations || 0
        privacyWarnings.textContent = stats.totalWarnings || 0
        networkRequests.textContent = stats.totalRequests || 0

        // Update last updated time
        const now = new Date()
        lastUpdated.textContent = 'Just now'

        // Update warning colors based on count
        updateWarningColors(stats.totalWarnings)
      }
    })
  }

  // Update warning colors based on count
  function updateWarningColors(warningCount) {
    privacyWarnings.className = 'stat-value'

    if (warningCount > 10) {
      privacyWarnings.classList.add('danger')
    } else if (warningCount > 5) {
      privacyWarnings.classList.add('warning')
    }
  }

  // Toggle AI monitoring on/off
  function toggleAIMonitoring(enabled) {
    chrome.runtime.sendMessage(
      {
        action: 'toggleAIMonitoring',
        enabled: enabled,
      },
      function (response) {
        if (response && response.success) {
          updateAIStatus(enabled)
          // Refresh stats after toggle
          setTimeout(loadStats, 1000)
        }
      }
    )
  }

  // Toggle logging on/off
  function toggleLogging(enabled) {
    chrome.runtime.sendMessage(
      {
        action: 'toggleLogging',
        enabled: enabled,
      },
      function (response) {
        if (response && response.success) {
          updateStatusText(enabled)
          updateLoggingStatus(enabled)
          // Refresh stats after toggle
          setTimeout(loadStats, 1000)
        }
      }
    )
  }

  // Update status text
  function updateStatusText(isEnabled) {
    statusText.textContent = isEnabled ? 'Active' : 'Inactive'
    statusText.style.color = isEnabled ? '#4CAF50' : '#f44336'
  }

  // Update AI status
  function updateAIStatus(isEnabled) {
    aiStatus.textContent = isEnabled ? 'Active' : 'Inactive'
    aiStatus.style.color = isEnabled ? '#4CAF50' : '#f44336'
  }

  // Update logging status
  function updateLoggingStatus(isEnabled) {
    loggingStatus.textContent = isEnabled ? 'Active' : 'Inactive'
    loggingStatus.style.color = isEnabled ? '#4CAF50' : '#f44336'
  }

  // Toggle dashboard view
  function toggleDashboard() {
    if (dashboard.style.display === 'none' || !dashboard.style.display) {
      dashboard.style.display = 'block'
      viewDashboardBtn.textContent = 'Hide Dashboard'
      loadDashboardData()
    } else {
      dashboard.style.display = 'none'
      viewDashboardBtn.textContent = '📊 Dashboard'
    }
  }

  // Load dashboard data
  function loadDashboardData() {
    const recentWarnings = document.getElementById('recentWarnings')
    const recentConversations = document.getElementById('recentConversations')
    const recentRequests = document.getElementById('recentRequests')

    // Show loading state
    recentWarnings.innerHTML = '<div class="loading">Loading warnings...</div>'
    recentConversations.innerHTML =
      '<div class="loading">Loading conversations...</div>'
    recentRequests.innerHTML = '<div class="loading">Loading requests...</div>'

    chrome.runtime.sendMessage(
      { action: 'getDashboardData' },
      function (response) {
        if (response && response.success) {
          displayDashboardData(response.data, response.localStats)
        } else {
          // Use local data if MongoDB is not available
          displayDashboardData(null, response.localStats)
        }
      }
    )
  }

  // Display dashboard data
  function displayDashboardData(mongoData, localStats) {
    const recentWarnings = document.getElementById('recentWarnings')
    const recentConversations = document.getElementById('recentConversations')
    const recentRequests = document.getElementById('recentRequests')

    // Display warnings
    if (localStats.warnings && localStats.warnings.length > 0) {
      const warningsHtml = localStats.warnings
        .slice(0, 5)
        .map(
          (warning, index) => `
        <div class="warning-item">
          <div class="risk-type">⚠️ ${
            warning.risks?.map((r) => r.type.replace('_', ' ')).join(', ') ||
            'Unknown Risk'
          }</div>
          <div class="content">${warning.content?.substring(0, 100)}${
            warning.content?.length > 100 ? '...' : ''
          }</div>
          <div class="meta">${new Date(warning.timestamp).toLocaleString()} • ${
            new URL(warning.url).hostname
          }</div>
        </div>
      `
        )
        .join('')
      recentWarnings.innerHTML = warningsHtml
    } else {
      recentWarnings.innerHTML =
        '<div class="conversation-item">No privacy warnings detected yet.</div>'
    }

    // Display conversations
    if (localStats.conversations && localStats.conversations.length > 0) {
      const allMessages = []
      localStats.conversations.forEach((conv) => {
        conv.forEach((msg) => allMessages.push(msg))
      })

      // Sort by timestamp and take recent ones
      const recentMessages = allMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)

      const conversationsHtml = recentMessages
        .map(
          (message, index) => `
        <div class="conversation-item">
          <div class="sender">${
            message.sender === 'bot' ? '🤖 Bot' : '👤 You'
          }</div>
          <div class="content">${message.content?.substring(0, 80)}${
            message.content?.length > 80 ? '...' : ''
          }</div>
          <div class="meta">${new Date(message.timestamp).toLocaleString()} • ${
            new URL(message.url).hostname
          }</div>
        </div>
      `
        )
        .join('')
      recentConversations.innerHTML = conversationsHtml
    } else {
      recentConversations.innerHTML =
        '<div class="conversation-item">No conversations monitored yet.</div>'
    }

    // Display network requests (placeholder for now)
    recentRequests.innerHTML =
      '<div class="conversation-item">Network requests are logged in real-time to MongoDB</div>'
  }

  // View detailed bot information
  function viewBotDetails() {
    chrome.runtime.sendMessage(
      { action: 'getBotDetails' },
      function (response) {
        if (response) {
          showBotDetailsModal(response)
        }
      }
    )
  }

  // Show bot details modal
  function showBotDetailsModal(data) {
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white;
      color: #333;
      padding: 20px;
      border-radius: 8px;
      max-width: 80%;
      max-height: 80%;
      overflow-y: auto;
      font-family: Arial, sans-serif;
    `

    let content = '<h2>🤖 Bot Detection Details</h2>'

    if (data.bots && data.bots.length > 0) {
      content += '<h3>Detected Bots:</h3>'
      data.bots.forEach((bot, index) => {
        content += `
          <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 4px;">
            <strong>Bot ${index + 1}:</strong> ${bot.type}<br>
            <strong>URL:</strong> ${new URL(bot.url).hostname}<br>
            <strong>First Seen:</strong> ${new Date(
              bot.firstSeen
            ).toLocaleString()}<br>
            <strong>Last Seen:</strong> ${new Date(
              bot.lastSeen
            ).toLocaleString()}
          </div>
        `
      })
    } else {
      content += '<p>No bots detected yet.</p>'
    }

    if (data.warnings && data.warnings.length > 0) {
      content += '<h3>Privacy Warnings:</h3>'
      data.warnings.slice(0, 10).forEach((warning, index) => {
        const severityColor =
          warning.severity === 'high'
            ? '#f44336'
            : warning.severity === 'medium'
            ? '#ff9800'
            : '#4caf50'
        content += `
          <div style="border-left: 4px solid ${severityColor}; padding: 10px; margin: 10px 0; background: #f9f9f9;">
            <strong>Warning ${
              index + 1
            }:</strong> ${warning.severity.toUpperCase()}<br>
            <strong>Risk:</strong> ${
              warning.risks?.map((r) => r.type.replace('_', ' ')).join(', ') ||
              'Unknown'
            }<br>
            <strong>Content:</strong> ${warning.content?.substring(0, 100)}${
          warning.content?.length > 100 ? '...' : ''
        }<br>
            <strong>Time:</strong> ${new Date(
              warning.timestamp
            ).toLocaleString()}
          </div>
        `
      })
      if (data.warnings.length > 10) {
        content += `<p>... and ${data.warnings.length - 10} more warnings</p>`
      }
    } else {
      content += '<p>No privacy warnings detected.</p>'
    }

    content += `
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="this.closest('.modal').remove()" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        ">Close</button>
      </div>
    `

    modalContent.innerHTML = content
    modal.appendChild(modalContent)
    modal.className = 'modal'
    document.body.appendChild(modal)

    // Close modal when clicking outside
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  // Clear all data
  function clearAllData() {
    chrome.runtime.sendMessage({ action: 'clearData' }, function (response) {
      if (response && response.success) {
        // Reset UI
        botsDetected.textContent = '0'
        conversations.textContent = '0'
        privacyWarnings.textContent = '0'
        networkRequests.textContent = '0'
        lastUpdated.textContent = '-'

        // Reset warning colors
        privacyWarnings.className = 'stat-value'

        // Clear dashboard
        if (dashboard.style.display !== 'none') {
          toggleDashboard()
        }

        // Show confirmation
        showNotification('Data cleared successfully!', 'success')
      }
    })
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === 'success'
          ? '#4caf50'
          : type === 'error'
          ? '#f44336'
          : '#2196f3'
      };
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 10001;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 3000)
  }

  // Refresh stats every 10 seconds
  setInterval(loadStats, 10000)

  // Load stats when popup is focused
  document.addEventListener('focus', loadStats)
})
