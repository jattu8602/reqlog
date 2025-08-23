# 🤖 AI Bot Privacy Guard

A browser extension that detects AI bots on websites and warns users about potential privacy risks. Built with modern web technologies and powered by Google's Gemini AI for enhanced detection capabilities.

## 🚀 Features

### Core Functionality

- **AI Bot Detection**: Automatically identifies AI chatbots and bots on websites
- **Real-time Monitoring**: Continuously monitors bot-user conversations
- **Privacy Risk Assessment**: Detects when bots request sensitive information
- **Smart Warnings**: Immediate alerts for potential privacy violations
- **AI-Enhanced Analysis**: Uses Gemini AI for sophisticated risk detection

### Privacy Risk Detection

The extension monitors for requests of:

- Phone numbers and contact information
- Email addresses
- Home/billing addresses
- Credit card and financial details
- Social Security Numbers (SSN)
- Date of birth and personal details
- Identity documents
- Bank account information
- Security questions
- Income and financial data

### User Experience

- **Non-intrusive Monitoring**: Works silently in the background
- **Real-time Notifications**: Immediate warnings for privacy risks
- **Detailed Analytics**: View bot detection history and warnings
- **Easy Management**: Simple toggle to enable/disable monitoring
- **Data Privacy**: All data stored locally, no external tracking

## 🛠️ Technical Architecture

### Browser Extension Components

- **Content Scripts**: Monitor webpage content and bot interactions
- **Background Service Worker**: Processes data and manages extension state
- **Popup Interface**: User controls and statistics display
- **Notification System**: Browser notifications for important alerts

### AI Integration

- **Gemini AI API**: Enhanced bot message analysis
- **Pattern Recognition**: Advanced privacy risk detection
- **Contextual Analysis**: Understanding conversation context
- **Risk Scoring**: Intelligent severity assessment

### Data Management

- **Local Storage**: All data stored locally for privacy
- **Real-time Updates**: Live statistics and monitoring
- **Data Export**: View detailed bot detection reports
- **Cleanup System**: Automatic data management

## 📦 Installation

### For Users

1. Download the extension files
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your browser toolbar

### For Developers

1. Clone the repository
2. Install dependencies: `npm install`
3. Make changes to the code
4. Load the extension in developer mode
5. Test your changes

## 🔧 Development

### Prerequisites

- Node.js (v14 or higher)
- Modern browser (Chrome, Edge, Firefox)
- Gemini AI API key (for enhanced detection)

### Project Structure

```
ai-bot-privacy-guard/
├── manifest.json          # Extension configuration
├── content.js            # Content script for bot detection
├── background.js         # Background service worker
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── icons/               # Extension icons
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

### Key Components

#### Content Script (`content.js`)

- Detects AI bots on webpages
- Monitors bot-user conversations
- Identifies privacy risks in real-time
- Sends warnings to background script

#### Background Script (`background.js`)

- Manages extension state
- Processes bot detection data
- Integrates with Gemini AI API
- Handles notifications and storage

#### Popup Interface (`popup.html/popup.js`)

- User controls and settings
- Real-time statistics display
- Bot detection details
- Data management options

## 🎯 How It Works

### 1. Bot Detection

The extension scans webpages for common AI bot indicators:

- Text content mentioning "chatbot", "AI assistant", etc.
- UI elements with bot-related classes
- Data attributes indicating bot functionality

### 2. Conversation Monitoring

Once a bot is detected, the extension:

- Monitors chat containers and input fields
- Tracks bot and user messages
- Analyzes conversation content for privacy risks

### 3. Risk Assessment

Messages are analyzed using:

- Pattern matching for common privacy risks
- Gemini AI for sophisticated analysis
- Context-aware risk scoring

### 4. User Protection

When risks are detected:

- Immediate visual warnings appear
- Browser notifications are sent
- Risk details are logged for review
- Users are advised on safe practices

## 🔒 Privacy & Security

- **Local Data Storage**: All data remains on your device
- **No External Tracking**: Extension doesn't send data to external servers
- **Transparent Operation**: Clear indication of what's being monitored
- **User Control**: Easy enable/disable functionality
- **Data Cleanup**: Options to clear stored information

## 🚨 Privacy Risk Categories

### High Risk

- Social Security Numbers
- Credit card information
- Bank account details

### Medium Risk

- Phone numbers
- Home addresses
- Identity documents

### Low Risk

- Email addresses
- General personal information
- Non-sensitive data

## 📊 Statistics & Analytics

The extension provides real-time statistics:

- Total bots detected
- Conversations monitored
- Privacy warnings issued
- Last activity timestamps

## 🎨 User Interface

### Popup Features

- Clean, modern design
- Real-time status updates
- Easy monitoring toggle
- Detailed bot information
- Data management tools

### Warning System

- Prominent visual alerts
- Clear risk descriptions
- Actionable recommendations
- Dismissible notifications

## 🔧 Configuration

### API Keys

To enable enhanced AI detection:

1. Get a Gemini AI API key from Google
2. Update the `GEMINI_API_KEY` in `background.js`
3. Restart the extension

### Customization

- Modify risk detection patterns
- Adjust warning thresholds
- Customize notification settings
- Add new bot detection rules

## 🚀 Future Enhancements

- **Machine Learning**: Improved bot detection accuracy
- **Risk Prediction**: Proactive privacy protection
- **User Education**: Privacy best practices guidance
- **Integration**: Connect with other security tools
- **Mobile Support**: Extend to mobile browsers

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- Enhanced bot detection algorithms
- Additional privacy risk patterns
- UI/UX improvements
- Performance optimizations
- Documentation updates

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This extension is designed to help protect user privacy but cannot guarantee complete protection. Users should always exercise caution when sharing personal information online and use this tool as part of a comprehensive privacy strategy.

## 🆘 Support

For issues, questions, or contributions:

- Check the documentation
- Review existing issues
- Create new issue reports
- Submit pull requests

---

**AI Bot Privacy Guard** - Protecting your privacy in the age of AI chatbots.
