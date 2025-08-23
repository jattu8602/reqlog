// Content script for capturing page-level information
;(function () {
  'use strict'

  // Capture page load information
  const pageInfo = {
    url: window.location.href,
    title: document.title,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    referrer: document.referrer,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  }

  // Send page info to background script
  chrome.runtime.sendMessage({
    action: 'pageInfo',
    data: pageInfo,
  })

  // Capture form submissions
  document.addEventListener('submit', function (event) {
    const formData = {
      action: 'formSubmission',
      data: {
        url: window.location.href,
        formAction: event.target.action,
        formMethod: event.target.method,
        timestamp: new Date().toISOString(),
        formData: new FormData(event.target),
      },
    }

    chrome.runtime.sendMessage(formData)
  })

  // Capture AJAX requests (if possible)
  if (window.XMLHttpRequest) {
    const originalXHR = window.XMLHttpRequest
    window.XMLHttpRequest = function () {
      const xhr = new originalXHR()
      const originalOpen = xhr.open
      const originalSend = xhr.send

      xhr.open = function (method, url, async, user, password) {
        this._method = method
        this._url = url
        return originalOpen.apply(this, arguments)
      }

      xhr.send = function (data) {
        const xhrData = {
          action: 'xhrRequest',
          data: {
            method: this._method,
            url: this._url,
            requestBody: data,
            timestamp: new Date().toISOString(),
            pageUrl: window.location.href,
          },
        }

        chrome.runtime.sendMessage(xhrData)
        return originalSend.apply(this, arguments)
      }

      return xhr
    }
  }

  // Capture fetch requests
  if (window.fetch) {
    const originalFetch = window.fetch
    window.fetch = function (input, init) {
      const fetchData = {
        action: 'fetchRequest',
        data: {
          url: typeof input === 'string' ? input : input.url,
          method: init?.method || 'GET',
          requestBody: init?.body,
          timestamp: new Date().toISOString(),
          pageUrl: window.location.href,
        },
      }

      chrome.runtime.sendMessage(fetchData)
      return originalFetch.apply(this, arguments)
    }
  }

  // Monitor for dynamic content changes
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList') {
        // Check for new forms or interactive elements
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM') {
              node.addEventListener('submit', function (event) {
                const formData = {
                  action: 'dynamicFormSubmission',
                  data: {
                    url: window.location.href,
                    formAction: event.target.action,
                    formMethod: event.target.method,
                    timestamp: new Date().toISOString(),
                    formData: new FormData(event.target),
                  },
                }

                chrome.runtime.sendMessage(formData)
              })
            }
          }
        })
      }
    })
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  console.log('Request Logger content script loaded')
})()
