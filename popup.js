// Popup script for handling user interactions
document.addEventListener('DOMContentLoaded', function () {
  const loggingToggle = document.getElementById('loggingToggle')
  const statusText = document.getElementById('statusText')
  const totalRequests = document.getElementById('totalRequests')

  // Load initial state
  loadStatus()
  loadStats()

  // Set up event listeners
  loggingToggle.addEventListener('change', function () {
    const isEnabled = this.checked
    toggleLogging(isEnabled)
  })

  // Load current logging status
  function loadStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function (response) {
      if (response && response.isLoggingEnabled !== undefined) {
        loggingToggle.checked = response.isLoggingEnabled
        updateStatusText(response.isLoggingEnabled)
      }
    })
  }

  // Load statistics
  function loadStats() {
    chrome.runtime.sendMessage({ action: 'getStats' }, function (response) {
      if (response) {
        totalRequests.textContent = response.totalRequests || 0
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

  // Refresh stats every 5 seconds
  setInterval(loadStats, 5000)
})
