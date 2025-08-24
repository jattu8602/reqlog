# 🤖 AI Bot Privacy Guard Extension

A Chrome extension that detects AI bots on websites and warns users about potential privacy risks in real-time conversations.

## ✨ Features

- **Real-time Bot Detection**: Automatically detects AI chatbots and virtual assistants on websites
- **Conversation Monitoring**: Monitors conversations between users and AI bots in real-time
- **Privacy Risk Detection**: Identifies when bots request personal information like:
  - Phone numbers
  - Email addresses
  - Home addresses
  - Credit card information
  - Social Security numbers
  - Date of birth
  - Bank account details
  - And more...
- **Instant Warnings**: Shows immediate privacy warnings when risks are detected
- **AI-Enhanced Detection**: Uses Gemini AI for advanced privacy risk analysis
- **Statistics Tracking**: Tracks detected bots, conversations, and warnings
- **User-Friendly Interface**: Clean popup with monitoring controls and statistics

## 🚀 How It Works

1. **Bot Detection**: The extension scans web pages for AI bot indicators using:
   - HTML attributes and data properties
   - CSS classes and IDs
   - Text content analysis
   - Structural analysis of chat widgets
   - ARIA roles and labels

2. **Real-time Monitoring**: Once a bot is detected, the extension:
   - Monitors all conversation messages
   - Tracks user inputs and bot responses
   - Analyzes content for privacy risks

3. **Privacy Protection**: When personal information requests are detected:
   - Shows immediate warning popups
   - Sends notifications to the user
   - Logs the risk for future reference
   - Uses AI analysis for enhanced detection

## 🧪 Testing the Extension

### 1. Install the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension folder
4. The extension icon should appear in your toolbar

### 2. Test with the Demo Page
1. Open `test-bot-detection.html` in your browser
2. Click the chat button (💬) in the bottom right corner
3. Start a conversation with the AI bot
4. Watch for privacy warnings when the bot asks for personal information

### 3. Test on Real Websites
Visit websites with AI chatbots like:
- Customer service pages
- E-commerce sites with live chat
- Support portals
- Any site with chat widgets

## 🔧 How to Use

### Extension Popup
- Click the extension icon to open the popup
- Toggle monitoring on/off
- View statistics (bots detected, conversations, warnings)
- Access detailed bot information
- Clear stored data

### Privacy Warnings
When the extension detects a privacy risk:
- A red warning popup appears on the page
- Browser notifications are sent
- The risk is logged in the extension
- You can dismiss or hide warnings

### Monitoring Status
The extension shows:
- **Active**: Monitoring is enabled and working
- **Inactive**: Monitoring is disabled
- Real-time statistics updates
- Last activity timestamps

## 🛠️ Technical Details

### Architecture
- **Content Script**: Runs on web pages, detects bots and monitors conversations
- **Background Script**: Manages extension state, processes messages, and handles notifications
- **Popup**: User interface for controlling the extension and viewing statistics

### Bot Detection Algorithm
The extension uses a scoring system to identify AI bots:
- **High-confidence indicators** (15 points): data attributes, specific IDs
- **Medium-confidence indicators** (8-12 points): class names, ARIA roles, structural patterns
- **Low-confidence indicators** (3 points): text content keywords
- **Threshold**: Elements need 12+ points to be classified as bots

### Privacy Risk Patterns
Uses regex patterns to detect requests for:
- Personal identifiers (name, age, location)
- Contact information (phone, email, address)
- Financial data (credit cards, bank accounts)
- Identity documents (SSN, passport, license)
- Sensitive questions (security questions, income)

## 🚨 Privacy & Security

- **Local Processing**: All conversation analysis happens locally in your browser
- **No Data Collection**: The extension doesn't collect or transmit personal data
- **User Control**: You can disable monitoring at any time
- **Transparent**: All detected risks are clearly explained

## 🔍 Troubleshooting

### Extension Not Working?
1. Check that the extension is enabled in `chrome://extensions/`
2. Ensure the extension has permission to access the current website
3. Check the browser console for error messages
4. Try refreshing the page

### No Bot Detection?
1. Some bots may use advanced techniques to avoid detection
2. The extension focuses on common chat widget patterns
3. Check the extension popup for detection statistics

### Privacy Warnings Not Showing?
1. Make sure monitoring is enabled in the extension popup
2. Check browser notification permissions
3. Some websites may block extension functionality

## 📱 Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## 📄 License

This project is open source and available under the MIT License.

---

**⚠️ Disclaimer**: This extension is designed to help protect your privacy, but it's not a substitute for common sense. Always be cautious when sharing personal information online.
