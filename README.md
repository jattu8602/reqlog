# Request Logger Chrome Extension

A Chrome extension that captures network requests from websites and logs them to MongoDB via an API endpoint.

## Features

- 🔍 **Network Request Capture**: Captures all HTTP/HTTPS requests using `chrome.webRequest`
- 📊 **Comprehensive Logging**: Logs URL, method, status, headers, response size/time, and more
- 🎯 **Real-time Monitoring**: Live streaming of request logs to your API
- 💾 **MongoDB Integration**: Stores logs in MongoDB for further analysis
- 🎨 **Beautiful UI**: Modern, responsive popup interface with toggle controls
- 📱 **Content Script Integration**: Captures page-level information and form submissions

## What We Can Do ✅

1. **Capture Network Requests**: All HTTP/HTTPS requests made by the browser
2. **Request Details**: Method, URL, headers, request body, timestamp
3. **Response Details**: Status code, response headers, response size, latency
4. **Error Handling**: Capture failed requests and network errors
5. **Form Submissions**: Monitor form submissions and AJAX requests
6. **Page Information**: Document title, URL, referrer, viewport dimensions
7. **Real-time Logging**: Stream logs to your API endpoint
8. **Toggle Controls**: Enable/disable logging on demand
9. **Statistics**: Track total requests captured

## What We Cannot Do ❌

1. **HTTPS Content**: Cannot read encrypted request/response bodies due to security restrictions
2. **Private Browsing**: Limited functionality in incognito mode
3. **Extension Pages**: Cannot capture requests from chrome://, chrome-extension://, or other extension pages
4. **WebSocket Data**: Limited WebSocket monitoring capabilities
5. **File Downloads**: Cannot capture file download content, only metadata
6. **Cross-Origin Restrictions**: Some limitations on cross-origin request details
7. **Browser Extensions**: Cannot monitor other browser extensions' requests

## Installation

### 1. Download the Extension

1. Clone or download this repository
2. Ensure all files are in the same directory:
   - `manifest.json`
   - `background.js`
   - `popup.html`
   - `popup.js`
   - `content.js`

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the directory containing your extension files
5. The extension should now appear in your extensions list

### 3. Configure API Endpoint

1. Open `background.js`
2. Replace `https://your-api-endpoint.com/api/logs` with your actual API endpoint
3. The MongoDB connection string is already configured

### 4. Grant Permissions

1. Click on the extension icon in your toolbar
2. Chrome will prompt for necessary permissions
3. Accept all permissions for full functionality

## Testing Process

### 1. Basic Functionality Test

1. **Install Extension**: Follow installation steps above
2. **Check Popup**: Click extension icon to verify popup loads
3. **Toggle Logging**: Test the on/off switch
4. **Visit Websites**: Navigate to different websites to trigger requests

### 2. Network Capture Test

1. **Open Developer Tools**: Press F12 and go to Network tab
2. **Enable Extension**: Ensure logging is enabled in popup
3. **Browse Website**: Navigate to a website with forms/API calls
4. **Check Console**: Look for extension messages in console
5. **Verify API Calls**: Check your API endpoint for incoming logs

### 3. Content Script Test

1. **Form Submission**: Fill out and submit a form on any website
2. **AJAX Requests**: Visit sites with dynamic content loading
3. **Page Navigation**: Navigate between different pages
4. **Check Background**: Verify data is being sent to background script

### 4. Database Integration Test

1. **Check API Logs**: Verify logs are reaching your API endpoint
2. **MongoDB Storage**: Confirm logs are being stored in MongoDB
3. **Data Format**: Verify log structure matches expected schema

## API Endpoint Requirements

Your API endpoint should:

1. **Accept POST requests** to `/api/logs`
2. **Handle JSON payloads** with the log entry structure
3. **Connect to MongoDB** using the provided connection string
4. **Return appropriate HTTP status codes**

## Log Entry Schema

```json
{
  "timestamp": "2025-01-23T12:34:56Z",
  "url": "https://example.com/api/v1/user",
  "method": "POST",
  "status_code": 200,
  "request_headers": {},
  "request_body": {},
  "response_headers": {},
  "response_body": {},
  "latency_ms": 312,
  "request_size_bytes": 420,
  "response_size_bytes": 245,
  "ip_address": "192.168.1.15",
  "protocol": "https",
  "error": null,
  "mongodb_url": "mongodb+srv://..."
}
```

## Troubleshooting

### Extension Not Loading

- Check `manifest.json` syntax
- Verify all files are in the same directory
- Check Chrome console for errors

### No Network Requests Captured

- Ensure extension has necessary permissions
- Check if logging is enabled in popup
- Verify `host_permissions` includes `<all_urls>`

### API Calls Failing

- Check your API endpoint URL in `background.js`
- Verify API endpoint is accessible
- Check network tab for failed requests

### Content Script Issues

- Ensure `content.js` is properly referenced in manifest
- Check for JavaScript errors in page console
- Verify content script matches are correct

## Security Considerations

1. **Permissions**: Extension requests broad permissions - use responsibly
2. **Data Privacy**: Be aware of what data is being captured
3. **API Security**: Secure your API endpoint appropriately
4. **MongoDB Access**: Restrict database access to necessary users only

## Performance Impact

- **Memory**: Minimal memory usage for request tracking
- **CPU**: Low CPU impact for request monitoring
- **Network**: Additional API calls to your endpoint
- **Storage**: Local storage for extension settings only

## Browser Compatibility

- **Chrome**: Full support (tested)
- **Edge**: Should work (Chromium-based)
- **Firefox**: Requires manifest v2 conversion
- **Safari**: Not supported (different extension system)

## Development

To modify the extension:

1. **Edit Files**: Modify JavaScript, HTML, or CSS files
2. **Reload Extension**: Click reload button in `chrome://extensions/`
3. **Test Changes**: Visit websites to test modifications
4. **Debug**: Use Chrome DevTools for background script debugging

## Support

For issues or questions:

1. Check Chrome extension console for errors
2. Verify all permissions are granted
3. Test with simple websites first
4. Check API endpoint accessibility

---

**Note**: This extension captures sensitive network data. Use responsibly and ensure compliance with privacy laws and website terms of service.
# reqlog
