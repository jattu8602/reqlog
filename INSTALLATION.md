# 🚀 Installation Guide - AI Bot Privacy Guard

## 📋 Prerequisites

- **Google Chrome** or **Microsoft Edge** (Chromium-based browsers)
- **Developer Mode** access in your browser
- **AI Bot Privacy Guard** extension files

## 🔧 Installation Steps

### Step 1: Download the Extension

1. Download or clone the extension files to your computer
2. Make sure you have all the required files:
   - `manifest.json`
   - `content.js`
   - `background.js`
   - `popup.html`
   - `popup.js`
   - `icons/` folder

### Step 2: Enable Developer Mode

1. Open Chrome/Edge and go to `chrome://extensions/`
2. In the top-right corner, toggle **"Developer mode"** to **ON**
3. You should see additional options appear

### Step 3: Load the Extension

1. Click **"Load unpacked"** button
2. Navigate to the folder containing your extension files
3. Select the folder and click **"Select Folder"**
4. The extension should now appear in your extensions list

### Step 4: Verify Installation

1. Look for **"AI Bot Privacy Guard"** in your extensions list
2. The extension icon should appear in your browser toolbar
3. Click the icon to open the popup and verify it's working

## 🧪 Testing the Extension

### Test Page

1. Open the `test-bot-detection.html` file in your browser
2. The extension should detect the AI bot on the page
3. Try interacting with the bot to test privacy risk detection
4. Check the extension popup for statistics and warnings

### What to Expect

- **Bot Detection**: Extension should detect the test chatbot
- **Conversation Monitoring**: All bot-user messages should be monitored
- **Privacy Warnings**: Alerts when personal information is requested
- **Real-time Updates**: Statistics should update as you interact

## ⚙️ Configuration

### Gemini AI Integration (Optional)

For enhanced detection capabilities:

1. Get a Gemini AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open `background.js` in a text editor
3. Replace the `GEMINI_API_KEY` value with your actual key
4. Reload the extension

### Customization

- Modify risk detection patterns in `content.js`
- Adjust warning thresholds in the code
- Customize notification settings
- Add new bot detection rules

## 🚨 Troubleshooting

### Extension Not Loading

- Ensure all required files are present
- Check that Developer mode is enabled
- Try refreshing the extensions page
- Look for error messages in the console

### Not Detecting Bots

- Make sure the extension is enabled
- Check that content scripts are running
- Verify the target website allows extensions
- Look for console errors in the content script

### Privacy Warnings Not Showing

- Check extension permissions
- Verify monitoring is enabled
- Test with the provided test page
- Check browser notification settings

## 🔒 Privacy & Security

- **Local Storage**: All data is stored locally on your device
- **No External Tracking**: Extension doesn't send data to external servers
- **Transparent Operation**: Clear indication of what's being monitored
- **User Control**: Easy enable/disable functionality

## 📱 Browser Compatibility

- ✅ **Google Chrome** (v88+)
- ✅ **Microsoft Edge** (v88+)
- ✅ **Brave Browser**
- ✅ **Other Chromium-based browsers**
- ❌ **Firefox** (requires different manifest format)
- ❌ **Safari** (requires different architecture)

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify all files are in the correct locations
3. Ensure Developer mode is properly enabled
4. Test with the provided test page
5. Check extension permissions in browser settings

## 🔄 Updating the Extension

To update to a newer version:

1. Download the new extension files
2. Go to `chrome://extensions/`
3. Click the **"Reload"** button on the AI Bot Privacy Guard extension
4. Or remove and reinstall the extension

---

**Need more help?** Check the main README.md file for detailed documentation and troubleshooting tips.
