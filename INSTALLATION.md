# 📥 Installation Guide

## Quick Start

### 1. Download the Extension
- Download all the extension files to a folder on your computer
- Make sure you have these files:
  - `manifest.json`
  - `content.js`
  - `background.js`
  - `popup.html`
  - `popup.js`
  - `icons/ext.png`

### 2. Install in Chrome
1. Open Chrome browser
2. Go to `chrome://extensions/` (type this in the address bar)
3. Turn on **"Developer mode"** in the top right corner
4. Click **"Load unpacked"**
5. Select the folder containing your extension files
6. The extension should now appear in your extensions list

### 3. Enable the Extension
- Make sure the extension is **enabled** (toggle should be blue)
- The extension icon should appear in your browser toolbar (top right)

### 4. Test the Extension
1. Open the `test-bot-detection.html` file in your browser
2. Click the chat button (💬) to open the AI bot
3. Start a conversation - you should see privacy warnings appear
4. Check the extension popup for statistics

## Troubleshooting

### Extension Not Loading?
- Make sure all files are in the same folder
- Check that `manifest.json` is not corrupted
- Try refreshing the extensions page

### Extension Not Working?
- Check the browser console for error messages
- Make sure the extension has permission to access websites
- Try disabling and re-enabling the extension

### No Privacy Warnings?
- Check that monitoring is enabled in the extension popup
- Make sure browser notifications are allowed
- Try refreshing the test page

## Permissions

The extension needs these permissions to work:
- **Storage**: To save bot detection data
- **Active Tab**: To access the current webpage
- **Tabs**: To monitor multiple tabs
- **Scripting**: To inject detection scripts
- **Notifications**: To show privacy warnings

## Support

If you're still having issues:
1. Check the browser console for error messages
2. Make sure you're using a supported browser (Chrome 88+)
3. Try reinstalling the extension
4. Check the main README.md for more details
