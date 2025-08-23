// AI Bot Privacy Guard Popup Script
document.addEventListener('DOMContentLoaded', function () {
  const monitoringToggle = document.getElementById('monitoringToggle')
  const statusText = document.getElementById('statusText')
  const botsDetected = document.getElementById('botsDetected')
  const conversations = document.getElementById('conversations')
  const privacyWarnings = document.getElementById('privacyWarnings')
  const lastUpdated = document.getElementById('lastUpdated')
  const viewDetailsBtn = document.getElementById('viewDetails')
  const clearDataBtn = document.getElementById('clearData')

  // Load initial state
  loadStatus()
  loadStats()

  // Set up event listeners
  monitoringToggle.addEventListener('change', function () {
    const isEnabled = this.checked
    toggleMonitoring(isEnabled)
  })

  viewDetailsBtn.addEventListener('click', function () {
    viewBotDetails()
  })

  clearDataBtn.addEventListener('click', function () {
    if (
      confirm(
        'Are you sure you want to clear all bot detection data? This cannot be undone.'
      )
    ) {
      clearAllData()
    }
  })

  // Load current monitoring status
  function loadStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function (response) {
      if (response && response.isMonitoringEnabled !== undefined) {
        monitoringToggle.checked = response.isMonitoringEnabled
        updateStatusText(response.isMonitoringEnabled)
      }
    })
  }

  // Load statistics
  function loadStats() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function (response) {
      if (response && response.stats) {
        const stats = response.stats
        botsDetected.textContent = stats.totalBots || 0
        conversations.textContent = stats.totalConversations || 0
        privacyWarnings.textContent = stats.totalWarnings || 0

        // Update last updated time
        if (stats.lastUpdated) {
          const lastUpdate = new Date(stats.lastUpdated)
          const now = new Date()
          const diffMs = now - lastUpdate
          const diffMins = Math.floor(diffMs / 60000)

          if (diffMins < 1) {
            lastUpdated.textContent = 'Just now'
          } else if (diffMins < 60) {
            lastUpdated.textContent = `${diffMins}m ago`
          } else {
            const diffHours = Math.floor(diffMins / 60)
            lastUpdated.textContent = `${diffHours}h ago`
          }
        }

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

  // Toggle monitoring on/off
  function toggleMonitoring(enabled) {
    chrome.runtime.sendMessage(
      {
        action: 'toggleMonitoring',
        enabled: enabled,
      },
      function (response) {
        if (response && response.success) {
          updateStatusText(enabled)
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
        lastUpdated.textContent = '-'

        // Reset warning colors
        privacyWarnings.className = 'stat-value'

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
