// AI Bot Detection Content Script
;(function () {
  'use strict'

  // Configuration
  const BOT_INDICATORS = [
    'chatbot',
    'ai assistant',
    'virtual assistant',
    'bot',
    'ai chat',
    'live chat',
    'chat with us',
    'support chat',
  ]

  const PRIVACY_RISK_PATTERNS = [
    /(?:phone|mobile|cell)\s*(?:number|#|no)/i,
    /(?:email|e-mail)\s*(?:address|addy)/i,
    /(?:home|billing|shipping)\s*address/i,
    /(?:credit\s*card|debit\s*card|card\s*number)/i,
    /(?:ssn|social\s*security\s*number|social\s*security)/i,
    /(?:date\s*of\s*birth|birthday|dob)/i,
    /(?:passport|drivers?\s*license|id\s*number)/i,
    /(?:bank\s*account|routing\s*number|account\s*number)/i,
    /(?:mothers?\s*maiden\s*name|security\s*question)/i,
    /(?:income|salary|annual\s*earnings)/i,
  ]

  // State management
  let detectedBots = new Set()
  let conversationHistory = []
  let isMonitoring = false
  let privacyWarnings = []

  // Initialize bot detection
  function initializeBotDetection() {
    console.log('AI Bot Privacy Guard: Starting bot detection...')

    // Scan for existing bots
    scanForBots()

    // Monitor for dynamic bot additions
    observePageChanges()

    // Start conversation monitoring
    startConversationMonitoring()
  }

  // Scan page for AI bots
  function scanForBots() {
    const elements = document.querySelectorAll('*')

    elements.forEach((element) => {
      if (isBotElement(element)) {
        registerBot(element)
      }
    })
  }

  // Check if an element is likely an AI bot
  function isBotElement(element) {
    // Ignore invisible elements, which can cause false positives
    if (!element.offsetParent && element.tagName !== 'BODY') {
      return false
    }

    let score = 0
    const text = (element.textContent || '').toLowerCase()
    const className = (element.className || '').toLowerCase()
    const id = (element.id || '').toLowerCase()
    const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase()
    const role = (element.getAttribute('role') || '').toLowerCase()

    // 1. High-confidence attributes
    if (
      element.hasAttribute('data-bot') ||
      element.hasAttribute('data-chatbot')
    ) {
      score += 10
    }
    if (
      id.includes('chatbot') ||
      id.includes('bot-widget') ||
      className.includes('chatbot-widget')
    ) {
      score += 10
    }

    // 2. Keywords in relevant attributes
    const contentToCheck = `${className} ${id} ${ariaLabel}`
    BOT_INDICATORS.forEach((indicator) => {
      if (contentToCheck.includes(indicator)) {
        score += 5
      }
    })

    // 3. Keywords in text content (lower weight to avoid false positives)
    BOT_INDICATORS.forEach((indicator) => {
      if (text.includes(indicator)) {
        score += 1
      }
    })

    // 4. Structural analysis for chat widgets
    const hasInputField = element.querySelector(
      'input, textarea, [role="textbox"]'
    )
    const hasMessageList = element.querySelector(
      '[role="log"], .messages, .chat-history'
    )
    const hasSendButton = element.querySelector('button, [role="button"]')

    if (hasInputField && (hasMessageList || hasSendButton)) {
      score += 5
    }

    // 5. ARIA roles indicating an application or dialog
    if (
      role === 'dialog' ||
      role === 'complementary' ||
      role === 'application'
    ) {
      if (ariaLabel.includes('chat') || ariaLabel.includes('bot')) {
        score += 8
      } else {
        score += 2 // Still a hint
      }
    }

    // 6. Check for iframes that might host a bot
    if (element.tagName === 'IFRAME') {
      try {
        const src = element.src.toLowerCase()
        if (src.includes('bot') || src.includes('chat')) {
          score += 10
        }
      } catch (e) {
        // Cross-origin iframe, cannot access src, skip
      }
    }

    // 7. Penalize large, generic elements to avoid flagging entire page sections
    if (
      element.tagName === 'BODY' ||
      element.tagName === 'MAIN' ||
      (element.tagName === 'DIV' &&
        element.offsetHeight > window.innerHeight * 0.9)
    ) {
      score -= 10
    }

    // An element must have a significant score to be considered a bot
    return score >= 10
  }

  // Register a detected bot
  function registerBot(botElement) {
    const botId = generateBotId(botElement)

    if (!detectedBots.has(botId)) {
      detectedBots.add(botId)

      const botInfo = {
        id: botId,
        element: botElement,
        type: determineBotType(botElement),
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }

      console.log('AI Bot detected:', botInfo)

      // Send bot detection to background script
      chrome.runtime.sendMessage({
        action: 'botDetected',
        data: botInfo,
      })

      // Start monitoring this specific bot
      monitorBotConversation(botElement, botId)
    }
  }

  // Generate unique ID for bot
  function generateBotId(element) {
    return `${element.tagName}-${element.className}-${element.id}-${Date.now()}`
  }

  // Determine bot type based on context
  function determineBotType(element) {
    const text = element.textContent?.toLowerCase() || ''

    if (text.includes('customer service') || text.includes('support')) {
      return 'customer_service'
    } else if (text.includes('sales') || text.includes('marketing')) {
      return 'sales_marketing'
    } else if (text.includes('help') || text.includes('assistant')) {
      return 'general_assistant'
    } else {
      return 'unknown'
    }
  }

  // Monitor bot conversations
  function monitorBotConversation(botElement, botId) {
    // Look for input fields and chat containers
    const chatContainer = findChatContainer(botElement)
    const inputFields = findInputFields(botElement)

    if (chatContainer) {
      monitorChatContainer(chatContainer, botId)
    }

    if (inputFields.length > 0) {
      monitorInputFields(inputFields, botId)
    }
  }

  // Find chat container within bot element
  function findChatContainer(botElement) {
    return (
      botElement.querySelector(
        '.chat-container, .chat-window, .conversation, .messages, .chat-area'
      ) ||
      botElement.closest(
        '.chat-container, .chat-window, .conversation, .messages, .chat-area'
      )
    )
  }

  // Find input fields within bot element
  function findInputFields(botElement) {
    return botElement.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], textarea, .chat-input, .message-input'
    )
  }

  // Monitor chat container for new messages
  function monitorChatContainer(chatContainer, botId) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              processNewMessage(node, botId, 'bot')
            }
          })
        }
      })
    })

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    })
  }

  // Monitor input fields for user input
  function monitorInputFields(inputFields, botId) {
    inputFields.forEach((input) => {
      // Monitor for form submissions
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const userInput = input.value.trim()
          if (userInput) {
            processNewMessage(input, botId, 'user', userInput)
          }
        }
      })

      // Monitor for blur events (when user finishes typing)
      input.addEventListener('blur', () => {
        const userInput = input.value.trim()
        if (userInput) {
          processNewMessage(input, botId, 'user', userInput)
        }
      })
    })
  }

  // Process new messages for privacy risks
  function processNewMessage(element, botId, sender, content = null) {
    const messageContent = content || element.textContent?.trim() || ''

    if (!messageContent) return

    const message = {
      botId,
      sender,
      content: messageContent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    }

    // Add to conversation history
    conversationHistory.push(message)

    // Check for privacy risks
    const privacyRisks = detectPrivacyRisks(messageContent)

    if (privacyRisks.length > 0) {
      const warning = {
        ...message,
        risks: privacyRisks,
        severity: calculateRiskSeverity(privacyRisks),
      }

      privacyWarnings.push(warning)

      // Send warning to background script
      chrome.runtime.sendMessage({
        action: 'privacyWarning',
        data: warning,
      })

      // Show immediate warning to user
      showPrivacyWarning(warning)
    }

    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'conversationMessage',
      data: message,
    })
  }

  // Detect privacy risks in message content
  function detectPrivacyRisks(content) {
    const risks = []

    PRIVACY_RISK_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        risks.push({
          type: getRiskType(index),
          pattern: pattern.source,
          matched: content.match(pattern)[0],
        })
      }
    })

    return risks
  }

  // Get risk type based on pattern index
  function getRiskType(index) {
    const riskTypes = [
      'phone_number',
      'email',
      'address',
      'credit_card',
      'ssn',
      'birth_date',
      'id_document',
      'bank_account',
      'security_question',
      'income',
    ]
    return riskTypes[index] || 'unknown'
  }

  // Calculate risk severity
  function calculateRiskSeverity(risks) {
    const highRiskTypes = ['ssn', 'credit_card', 'bank_account']
    const mediumRiskTypes = ['phone_number', 'address', 'id_document']

    if (risks.some((risk) => highRiskTypes.includes(risk.type))) {
      return 'high'
    } else if (risks.some((risk) => mediumRiskTypes.includes(risk.type))) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // Show privacy warning to user
  function showPrivacyWarning(warning) {
    const warningDiv = document.createElement('div')
    warningDiv.className = 'ai-bot-privacy-warning'
    warningDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
        font-size: 14px;
      ">
        <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Privacy Warning</div>
        <div>This AI bot is requesting ${warning.risks
          .map((r) => r.type.replace('_', ' '))
          .join(', ')}</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
          Be cautious about sharing personal information with AI bots
        </div>
        <button onclick="this.parentElement.remove()" style="
          background: white;
          color: #ff4444;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          margin-top: 10px;
          cursor: pointer;
        ">Dismiss</button>
      </div>
    `

    document.body.appendChild(warningDiv)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (warningDiv.parentElement) {
        warningDiv.remove()
      }
    }, 10000)
  }

  // Observe page changes for new bots
  function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (isBotElement(node)) {
                registerBot(node)
              }
              // Check children of added nodes
              const botChildren = node.querySelectorAll('*')
              botChildren.forEach((child) => {
                if (isBotElement(child)) {
                  registerBot(child)
                }
              })
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  // Start conversation monitoring
  function startConversationMonitoring() {
    isMonitoring = true
    console.log('AI Bot Privacy Guard: Conversation monitoring started')
  }

  // Send status update
  function sendStatusUpdate() {
    chrome.runtime.sendMessage({
      action: 'statusUpdate',
      data: {
        botsDetected: detectedBots.size,
        conversationsMonitored: conversationHistory.length,
        privacyWarnings: privacyWarnings.length,
        isMonitoring,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBotDetection)
  } else {
    initializeBotDetection()
  }

  // Send periodic status updates
  setInterval(sendStatusUpdate, 30000) // Every 30 seconds

  console.log('AI Bot Privacy Guard content script loaded')
})()
