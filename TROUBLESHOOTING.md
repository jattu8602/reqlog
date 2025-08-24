# 🔍 AI Bot Privacy Guard Troubleshooting Guide

## 🚨 **Current Issue: AI Bot Detection Not Working**

The Request Logger is working fine, but the AI Bot Privacy Guard functionality isn't detecting bots or showing privacy warnings.

## 🔧 **Step-by-Step Debugging**

### 1. **Reload the Extension**

```
1. Go to chrome://extensions/
2. Find "AI Bot Privacy Guard & Request Logger"
3. Click the 🔄 Reload button
4. Ensure it shows "Enabled"
```

### 2. **Check Console Logs**

```
1. Open test-both.html in Chrome
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for these messages:
   ✅ "🚀 AI Bot Privacy Guard Content Script Starting..."
   ✅ "🤖 AI Bot Privacy Guard: Starting bot detection..."
   ✅ "🔍 Scanning for existing bots..."
```

### 3. **Test Bot Detection Manually**

```
1. On test-both.html page
2. Click "🧪 Test Bot Detection" button
3. Look for console logs about bot detection
4. Check if the red test bot element appears
```

### 4. **Check Extension Communication**

```
1. Click "🔍 Check Extension Status" button
2. Look for response in console
3. Should see: "Extension is working and responding"
```

### 5. **Test Chat Widget**

```
1. Click the 💬 chat button (bottom right)
2. Send a message with privacy risk (e.g., "What's your name?")
3. Look for privacy warnings
4. Check console for bot detection logs
```

## 🐛 **Common Issues & Solutions**

### Issue 1: No Console Logs

**Symptoms:** No "🚀 AI Bot Privacy Guard Content Script Starting..." message
**Solutions:**

- ✅ Reload extension
- ✅ Check if extension is enabled
- ✅ Verify manifest.json has correct permissions
- ✅ Check for JavaScript errors in console

### Issue 2: Content Script Loads But No Bot Detection

**Symptoms:** See startup logs but no bot detection logs
**Solutions:**

- ✅ Check if page has elements with chat/bot classes
- ✅ Verify bot detection patterns in content.js
- ✅ Check if elements are visible (offsetParent check)
- ✅ Look for JavaScript errors in console

### Issue 3: Bot Detected But No Privacy Warnings

**Symptoms:** Bots are detected but no warnings shown
**Solutions:**

- ✅ Check if privacy risk patterns are matching
- ✅ Verify message monitoring is working
- ✅ Check if warnings are being sent to background script
- ✅ Look for errors in privacy risk detection

### Issue 4: Extension Not Responding

**Symptoms:** "Check Extension Status" shows errors
**Solutions:**

- ✅ Reload extension
- ✅ Check background script console
- ✅ Verify service worker is running
- ✅ Check extension permissions

## 🔍 **Debugging Commands**

### Check Extension Console

```
1. Go to chrome://extensions/
2. Find your extension
3. Click "service worker" link
4. Check console for background script logs
```

### Check Content Script Console

```
1. On test page, open DevTools (F12)
2. Go to Console tab
3. Look for content script messages
4. Filter by "AI Bot Privacy Guard" if needed
```

### Test Bot Detection Patterns

```
1. Open test-both.html
2. Create elements with these classes:
   - .chat-widget
   - .chat-bubble
   - [data-chat]
   - [data-bot]
3. Check console for detection logs
```

## 📊 **Expected Behavior**

### When Working Correctly:

```
✅ Content script loads with startup logs
✅ Bot detection scans page elements
✅ Chat widgets are detected and registered
✅ Conversation monitoring starts
✅ Privacy risks trigger warnings
✅ Background script receives messages
✅ Popup shows bot statistics
```

### Console Log Sequence:

```
🚀 AI Bot Privacy Guard Content Script Starting...
📍 Current URL: [your-page-url]
🔍 Extension ID: [extension-id]
🤖 AI Bot Privacy Guard: Starting bot detection...
🔍 Scanning for existing bots...
📊 Found [X] elements to scan
🤖 General scan found [X] bot elements
💬 Chat selector scan found [X] additional bot elements
🎯 Total bots detected: [X]
```

## 🚨 **If Still Not Working**

### 1. **Check File Permissions**

- Ensure all files are readable
- Check for syntax errors in content.js

### 2. **Verify Manifest**

- Check if content script is properly configured
- Verify permissions are correct

### 3. **Test in Incognito**

- Try the extension in incognito mode
- Disable other extensions temporarily

### 4. **Check Chrome Version**

- Ensure Chrome is up to date
- Manifest V3 requires Chrome 88+

## 📞 **Getting Help**

If issues persist:

1. Copy all console logs
2. Check extension service worker console
3. Verify API server is running
4. Test with simple HTML elements first

---

**Remember:** After making any changes to the extension files, you MUST reload the extension in `chrome://extensions/` for changes to take effect!
