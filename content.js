// AI Bot Privacy Guard Content Script
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
    'help chat',
    'customer service chat',
    'sales chat',
    'online chat',
    'web chat',
    'chat widget',
    'chat bubble',
    'floating chat',
    'chat support',
    'ai support',
    'virtual agent',
    'chat agent',
  ]

  const PRIVACY_RISK_PATTERNS = [
    /(?:what\s+is\s+your\s+)?(?:phone|mobile|cell)\s*(?:number|#|no|phone)/i,
    /(?:what\s+is\s+your\s+)?(?:email|e-mail)\s*(?:address|addy)/i,
    /(?:what\s+is\s+your\s+)?(?:home|billing|shipping)\s*address/i,
    /(?:what\s+is\s+your\s+)?(?:credit\s*card|debit\s*card|card\s*number)/i,
    /(?:what\s+is\s+your\s+)?(?:ssn|social\s*security\s*number|social\s*security)/i,
    /(?:what\s+is\s+your\s+)?(?:date\s*of\s*birth|birthday|dob)/i,
    /(?:what\s+is\s+your\s+)?(?:passport|drivers?\s*license|id\s*number)/i,
    /(?:what\s+is\s+your\s+)?(?:bank\s*account|routing\s*number|account\s*number)/i,
    /(?:what\s+is\s+your\s+)?(?:mothers?\s*maiden\s*name|security\s*question)/i,
    /(?:what\s+is\s+your\s+)?(?:income|salary|annual\s*earnings)/i,
    /(?:what\s+is\s+your\s+)?name/i,
    /(?:what\s+is\s+your\s+)?age/i,
    /(?:what\s+is\s+your\s+)?location/i,
    /(?:what\s+is\s+your\s+)?city/i,
    /(?:what\s+is\s+your\s+)?country/i,
    /(?:what\s+is\s+your\s+)?zip\s*code/i,
    /(?:what\s+is\s+your\s+)?postal\s*code/i,
    /(?:what\s+is\s+your\s+)?company/i,
    /(?:what\s+is\s+your\s+)?job/i,
    /(?:what\s+is\s+your\s+)?occupation/i,
  ]

  // State management
  let detectedBots = new Map()
  let conversationHistory = new Map()
  let isMonitoring = false
  let privacyWarnings = []
  let messageObserver = null

  // Initialize bot detection
  function initializeBotDetection() {
    console.log('AI Bot Privacy Guard: Starting bot detection...')

    // Wait a bit for page to load
    setTimeout(() => {
      // Scan for existing bots
      scanForBots()

      // Monitor for dynamic bot additions
      observePageChanges()

      // Start conversation monitoring
      startConversationMonitoring()
    }, 1000)
  }

  // Scan page for AI bots
  function scanForBots() {
    const elements = document.querySelectorAll('*')

    elements.forEach((element) => {
      if (isBotElement(element)) {
        registerBot(element)
      }
    })

    // Also check for common chat widget selectors
    const chatSelectors = [
      '.chat-widget',
      '.chat-bubble',
      '.floating-chat',
      '.chat-container',
      '.chat-window',
      '.chat-box',
      '.chat-popup',
      '.chat-overlay',
      '.chat-sidebar',
      '.chat-panel',
      '.chat-interface',
      '.chat-form',
      '.chat-input',
      '.chat-messages',
      '.chat-history',
      '.chat-area',
      '.chat-room',
      '.chat-dialog',
      '.chat-modal',
      '.chat-frame',
      '[data-chat]',
      '[data-bot]',
      '[data-chatbot]',
      '[data-widget="chat"]',
      '[data-widget="bot"]',
      '[class*="chat"]',
      '[id*="chat"]',
      '[class*="bot"]',
      '[id*="bot"]',
    ]

    chatSelectors.forEach((selector) => {
      try {
        const chatElements = document.querySelectorAll(selector)
        chatElements.forEach((element) => {
          if (element && !detectedBots.has(generateBotId(element))) {
            registerBot(element)
          }
        })
      } catch (e) {
        // Invalid selector, skip
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
    const dataAttributes = element
      .getAttributeNames()
      .filter((attr) => attr.startsWith('data-'))
      .map((attr) => element.getAttribute(attr).toLowerCase())

    // 1. High-confidence attributes
    if (
      element.hasAttribute('data-bot') ||
      element.hasAttribute('data-chatbot') ||
      element.hasAttribute('data-widget') ||
      element.hasAttribute('data-chat')
    ) {
      score += 15
    }

    // 2. Check data attributes for bot indicators
    dataAttributes.forEach((attrValue) => {
      BOT_INDICATORS.forEach((indicator) => {
        if (attrValue.includes(indicator)) {
          score += 10
        }
      })
    })

    // 3. Keywords in relevant attributes
    const contentToCheck = `${className} ${id} ${ariaLabel}`
    BOT_INDICATORS.forEach((indicator) => {
      if (contentToCheck.includes(indicator)) {
        score += 8
      }
    })

    // 4. Keywords in text content (lower weight to avoid false positives)
    BOT_INDICATORS.forEach((indicator) => {
      if (text.includes(indicator)) {
        score += 3
      }
    })

    // 5. Structural analysis for chat widgets
    const hasInputField = element.querySelector(
      'input, textarea, [role="textbox"], .chat-input, .message-input, [contenteditable="true"]'
    )
    const hasMessageList = element.querySelector(
      '[role="log"], .messages, .chat-history, .chat-messages, .conversation'
    )
    const hasSendButton = element.querySelector(
      'button, [role="button"], .send-btn, .submit-btn'
    )

    if (hasInputField && (hasMessageList || hasSendButton)) {
      score += 12
    }

    // 6. ARIA roles indicating an application or dialog
    if (
      role === 'dialog' ||
      role === 'complementary' ||
      role === 'application' ||
      role === 'form'
    ) {
      if (ariaLabel.includes('chat') || ariaLabel.includes('bot')) {
        score += 10
      } else {
        score += 3 // Still a hint
      }
    }

    // 7. Check for iframes that might host a bot
    if (element.tagName === 'IFRAME') {
      try {
        const src = element.src.toLowerCase()
        if (
          src.includes('bot') ||
          src.includes('chat') ||
          src.includes('widget')
        ) {
          score += 15
        }
      } catch (e) {
        // Cross-origin iframe, cannot access src, skip
      }
    }

    // 8. Check for common chat widget patterns
    if (element.classList.contains('chat') || element.id.includes('chat')) {
      score += 8
    }

    // 9. Penalize large, generic elements to avoid flagging entire page sections
    if (
      element.tagName === 'BODY' ||
      element.tagName === 'MAIN' ||
      (element.tagName === 'DIV' &&
        element.offsetHeight > window.innerHeight * 0.8)
    ) {
      score -= 15
    }

    // An element must have a significant score to be considered a bot
    return score >= 12
  }

  // Register a detected bot
  function registerBot(botElement) {
    const botId = generateBotId(botElement)

    if (!detectedBots.has(botId)) {
      detectedBots.set(botId, {
        id: botId,
        element: botElement,
        type: determineBotType(botElement),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        isActive: false,
      })

      console.log('AI Bot detected:', detectedBots.get(botId))

      // Send bot detection to background script
      try {
        chrome.runtime.sendMessage({
          action: 'botDetected',
          data: detectedBots.get(botId),
        })
      } catch (e) {
        console.log('Could not send message to background script:', e)
      }

      // Start monitoring this specific bot
      monitorBotConversation(botElement, botId)
    }
  }

  // Generate unique ID for bot
  function generateBotId(element) {
    const tag = element.tagName || 'DIV'
    const classes = element.className || ''
    const id = element.id || ''
    const timestamp = Date.now()
    return `${tag}-${classes.substring(0, 20)}-${id.substring(
      0,
      20
    )}-${timestamp}`
  }

  // Determine bot type based on context
  function determineBotType(element) {
    const text = element.textContent?.toLowerCase() || ''
    const className = element.className?.toLowerCase() || ''
    const id = element.id?.toLowerCase() || ''

    const content = `${text} ${className} ${id}`

    if (content.includes('customer service') || content.includes('support')) {
      return 'customer_service'
    } else if (content.includes('sales') || content.includes('marketing')) {
      return 'sales_marketing'
    } else if (content.includes('help') || content.includes('assistant')) {
      return 'general_assistant'
    } else if (content.includes('chat') || content.includes('bot')) {
      return 'chat_bot'
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

    // Also monitor the entire bot element for any changes
    monitorBotElement(botElement, botId)
  }

  // Find chat container within bot element
  function findChatContainer(botElement) {
    const selectors = [
      '.chat-container',
      '.chat-window',
      '.conversation',
      '.messages',
      '.chat-area',
      '.chat-messages',
      '.chat-history',
      '.chat-log',
      '.conversation-area',
      '[role="log"]',
      '[role="dialog"]',
      '.chat-panel',
      '.chat-box',
    ]

    for (const selector of selectors) {
      const container = botElement.querySelector(selector)
      if (container) return container
    }

    // If no specific container found, check if the bot element itself contains messages
    if (
      botElement.querySelector('.message, .msg, .chat-msg, .bot-msg, .user-msg')
    ) {
      return botElement
    }

    return null
  }

  // Find input fields within bot element
  function findInputFields(botElement) {
    const selectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'textarea',
      '.chat-input',
      '.message-input',
      '.bot-input',
      '.user-input',
      '[contenteditable="true"]',
      '[role="textbox"]',
      '.input-field',
    ]

    const inputs = []
    selectors.forEach((selector) => {
      try {
        const elements = botElement.querySelectorAll(selector)
        elements.forEach((el) => inputs.push(el))
      } catch (e) {
        // Invalid selector, skip
      }
    })

    return inputs
  }

  // Monitor chat container for new messages
  function monitorChatContainer(chatContainer, botId) {
    if (!chatContainer) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              processNewMessage(node, botId, 'bot')
            }
          })
        } else if (mutation.type === 'characterData') {
          // Handle text changes in existing elements
          const parent = mutation.target.parentElement
          if (parent && parent.textContent) {
            processNewMessage(parent, botId, 'bot')
          }
        }
      })
    })

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    // Store observer for cleanup
    if (!messageObserver) messageObserver = observer
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

      // Monitor for input changes
      input.addEventListener('input', (e) => {
        const userInput = e.target.value.trim()
        if (userInput) {
          processNewMessage(input, botId, 'user', userInput)
        }
      })
    })
  }

  // Monitor the entire bot element for any changes
  function monitorBotElement(botElement, botId) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this is a new message
              if (isMessageElement(node)) {
                processNewMessage(node, botId, 'bot')
              }
              // Also check children
              const messageChildren = node.querySelectorAll(
                '.message, .msg, .chat-msg, .bot-msg, .user-msg, [role="log"] > *'
              )
              messageChildren.forEach((child) => {
                if (isMessageElement(child)) {
                  processNewMessage(child, botId, 'bot')
                }
              })
            }
          })
        }
      })
    })

    observer.observe(botElement, {
      childList: true,
      subtree: true,
    })
  }

  // Check if an element is a message element
  function isMessageElement(element) {
    if (!element || !element.textContent) return false

    const text = element.textContent.trim()
    if (text.length < 3) return false

    const className = element.className?.toLowerCase() || ''
    const tagName = element.tagName?.toLowerCase() || ''

    // Check for message-like classes
    const messageClasses = [
      'message',
      'msg',
      'chat-msg',
      'bot-msg',
      'user-msg',
      'conversation-item',
    ]
    if (messageClasses.some((cls) => className.includes(cls))) return true

    // Check for message-like tags
    if (['p', 'div', 'span', 'li'].includes(tagName)) {
      // Check if it's not just a wrapper
      if (element.children.length <= 2) return true
    }

    return false
  }

  // Process new message from bot or user
  function processNewMessage(element, botId, sender, content = null) {
    const messageContent = content || element.textContent?.trim() || ''

    if (!messageContent || messageContent.length < 3) return

    // Enhanced risk detection
    const detectedRisks = detectPrivacyRisks(messageContent)
    const riskLevel = calculateRiskSeverity(detectedRisks)

    const message = {
      botId,
      sender,
      content: messageContent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      website: window.location.hostname,
      detectedRisks,
      riskLevel,
      elementType: element.tagName?.toLowerCase(),
      elementClasses: element.className || '',
      elementId: element.id || '',
      pageTitle: document.title,
      userAgent: navigator.userAgent,
      language: navigator.language,
    }

    // Add to conversation history
    if (!conversationHistory.has(botId)) {
      conversationHistory.set(botId, [])
    }
    conversationHistory.get(botId).push(message)

    // ALWAYS send message to background script for MongoDB storage
    try {
      chrome.runtime.sendMessage({
        action: 'conversationMessage',
        data: message,
      })
      console.log(
        'Message sent to background script for MongoDB storage:',
        message
      )
    } catch (e) {
      console.error('Could not send message to background script:', e)
      // Store locally as fallback
      storeMessageLocally(message)
    }

    // Check for privacy risks and create warnings
    if (detectedRisks.length > 0) {
      const warning = {
        botId,
        sender,
        content: messageContent,
        risks: detectedRisks,
        severity: riskLevel,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        website: window.location.hostname,
        riskLevel,
        pageTitle: document.title,
        userAgent: navigator.userAgent,
        language: navigator.language,
        elementContext: {
          tagName: element.tagName?.toLowerCase(),
          className: element.className || '',
          id: element.id || '',
          parentElement: element.parentElement?.tagName?.toLowerCase() || '',
          surroundingText: getSurroundingText(element),
        },
      }

      privacyWarnings.push(warning)

      // ALWAYS send warning to background script for MongoDB storage
      try {
        chrome.runtime.sendMessage({
          action: 'privacyWarning',
          data: warning,
        })
        console.log(
          'Privacy warning sent to background script for MongoDB storage:',
          warning
        )
      } catch (e) {
        console.error('Could not send warning to background script:', e)
        // Store locally as fallback
        storeWarningLocally(warning)
      }

      // Show immediate warning to user
      showPrivacyWarning(warning)
    }

    // Update bot status to active
    if (detectedBots.has(botId)) {
      const bot = detectedBots.get(botId)
      bot.isActive = true
      bot.lastActivity = new Date().toISOString()
    }
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
      'name',
      'age',
      'location',
      'city',
      'country',
      'zip_code',
      'postal_code',
      'company',
      'job',
      'occupation',
    ]
    return riskTypes[index] || 'unknown'
  }

  // Calculate risk severity
  function calculateRiskSeverity(risks) {
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
      return 'high'
    } else if (risks.some((risk) => mediumRiskTypes.includes(risk.type))) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // Get surrounding text for context
  function getSurroundingText(element) {
    try {
      const parent = element.parentElement
      if (!parent) return ''

      const siblings = Array.from(parent.children)
      const currentIndex = siblings.indexOf(element)

      let context = ''

      // Get text from previous sibling
      if (currentIndex > 0) {
        const prevSibling = siblings[currentIndex - 1]
        if (prevSibling.textContent) {
          context += prevSibling.textContent.trim().substring(0, 100) + ' '
        }
      }

      // Get text from next sibling
      if (currentIndex < siblings.length - 1) {
        const nextSibling = siblings[currentIndex + 1]
        if (nextSibling.textContent) {
          context += nextSibling.textContent.trim().substring(0, 100)
        }
      }

      return context.trim()
    } catch (e) {
      return ''
    }
  }

  // Enhanced privacy risk detection
  function detectPrivacyRisks(text) {
    const risks = []
    const lowerText = text.toLowerCase()

    PRIVACY_RISK_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(text)) {
        const riskType = getRiskType(index)
        const confidence = calculateConfidence(pattern, text)

        risks.push({
          type: riskType,
          confidence: confidence,
          pattern: pattern.source,
          matchedText: text.match(pattern)?.[0] || '',
          severity: getRiskSeverity(riskType),
        })
      }
    })

    // Additional context-based detection
    if (lowerText.includes('verify') && lowerText.includes('identity')) {
      risks.push({
        type: 'identity_verification',
        confidence: 'high',
        pattern: 'context_based',
        matchedText: 'identity verification request',
        severity: 'high',
      })
    }

    if (lowerText.includes('confirm') && lowerText.includes('account')) {
      risks.push({
        type: 'account_confirmation',
        confidence: 'medium',
        pattern: 'context_based',
        matchedText: 'account confirmation request',
        severity: 'medium',
      })
    }

    return risks
  }

  // Calculate confidence level
  function calculateConfidence(pattern, text) {
    const match = text.match(pattern)
    if (!match) return 'low'

    const matchedText = match[0]
    const textLength = text.length

    // Higher confidence if the pattern is a significant part of the text
    if (matchedText.length / textLength > 0.3) {
      return 'very_high'
    } else if (matchedText.length / textLength > 0.15) {
      return 'high'
    } else if (matchedText.length / textLength > 0.05) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // Get risk severity
  function getRiskSeverity(riskType) {
    const veryHighRisk = [
      'ssn',
      'credit_card',
      'bank_account',
      'passport',
      'drivers_license',
    ]
    const highRisk = [
      'phone_number',
      'address',
      'id_document',
      'email',
      'birth_date',
      'identity_verification',
    ]
    const mediumRisk = [
      'name',
      'age',
      'location',
      'city',
      'country',
      'zip_code',
      'postal_code',
      'company',
      'job',
      'occupation',
      'account_confirmation',
    ]

    if (veryHighRisk.includes(riskType)) return 'very_high'
    if (highRisk.includes(riskType)) return 'high'
    if (mediumRisk.includes(riskType)) return 'medium'
    return 'low'
  }

  // Show privacy warning to user
  function showPrivacyWarning(warning) {
    // Remove existing warnings for this bot
    const existingWarnings = document.querySelectorAll(
      `[data-bot-id="${warning.botId}"]`
    )
    existingWarnings.forEach((w) => w.remove())

    const warningDiv = document.createElement('div')
    warningDiv.className = 'ai-bot-privacy-warning'
    warningDiv.setAttribute('data-bot-id', warning.botId)
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
        max-width: 350px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Privacy Warning</div>
        <div style="margin-bottom: 8px;">This AI bot is asking for: <strong>${warning.risks
          .map((r) => r.type.replace('_', ' '))
          .join(', ')}</strong></div>
        <div style="margin-bottom: 10px; font-size: 12px; opacity: 0.9;">
          <strong>Warning:</strong> Be very careful about sharing personal information with AI bots!
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="this.closest('.ai-bot-privacy-warning').remove()" style="
            background: white;
            color: #ff4444;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex: 1;
          ">Dismiss</button>
          <button onclick="this.closest('.ai-bot-privacy-warning').style.display='none'" style="
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex: 1;
          ">Hide</button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `

    document.body.appendChild(warningDiv)

    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (warningDiv.parentElement) {
        warningDiv.remove()
      }
    }, 15000)
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
    try {
      chrome.runtime.sendMessage({
        action: 'statusUpdate',
        data: {
          botsDetected: detectedBots.size,
          conversationsMonitored: Array.from(
            conversationHistory.values()
          ).reduce((sum, conv) => sum + conv.length, 0),
          privacyWarnings: privacyWarnings.length,
          isMonitoring,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (e) {
      console.log('Could not send status update to background script:', e)
    }
  }

  // Local storage fallback functions
  function storeMessageLocally(message) {
    try {
      const localMessages = JSON.parse(
        localStorage.getItem('localMessages') || '[]'
      )
      localMessages.push({
        ...message,
        storedLocally: true,
        localTimestamp: new Date().toISOString(),
      })
      localStorage.setItem('localMessages', JSON.stringify(localMessages))
      console.log('Message stored locally as fallback')
    } catch (e) {
      console.error('Failed to store message locally:', e)
    }
  }

  function storeWarningLocally(warning) {
    try {
      const localWarnings = JSON.parse(
        localStorage.getItem('localWarnings') || '[]'
      )
      localWarnings.push({
        ...warning,
        storedLocally: true,
        localTimestamp: new Date().toISOString(),
      })
      localStorage.setItem('localWarnings', JSON.stringify(localWarnings))
      console.log('Warning stored locally as fallback')
    } catch (e) {
      console.error('Failed to store warning locally:', e)
    }
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
