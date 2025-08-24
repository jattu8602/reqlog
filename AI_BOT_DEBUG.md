# 🤖 AI Bot Privacy Guard Debugging Guide

## 🚨 **Current Issue: AI Bot Stats Not Working**

The Request Logger is working fine, but the AI Bot Privacy Guard functionality isn't showing stats or detecting bots.

## 🔧 **Immediate Debugging Steps**

### 1. **Reload Extension (CRITICAL)**

```
1. Go to chrome://extensions/
2. Find "AI Bot Privacy Guard & Request Logger"
3. Click the 🔄 Reload button
4. Ensure it shows "Enabled"
```

### 2. **Test Content Script Loading**

```
1. Open test-both.html in Chrome
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for these messages:
   ✅ "🚀 AI Bot Privacy Guard Content Script Starting..."
   ✅ "🤖 AI Bot Privacy Guard: Starting bot detection..."
   ✅ "🔍 Scanning for existing bots..."
```

**If you DON'T see these messages, the content script isn't loading!**

### 3. **Check Extension Communication**

```
1. Click "🔍 Check Extension Status" button
2. Look for response in console
3. Should see: "Extension is working and responding"
```

### 4. **Test Content Script Context**

```
1. Click "🔬 Test Content Script" button
2. Check if Chrome runtime is available
3. Verify extension ID and manifest
```

### 5. **Test Bot Detection Manually**

```
1. Click "🧪 Test Bot Detection" button
2. Look for console logs about bot detection
3. Check if the red test bot element appears
```

### 6. **Test Privacy Risk Detection**

```
1. Click "🚨 Simulate Privacy Risk" button
2. Look for privacy warnings
3. Check console for risk detection logs
```

## 🐛 **Common Issues & Solutions**

### Issue 1: Content Script Not Loading

**Symptoms:** No startup logs in console
**Solutions:**

- ✅ Reload extension
- ✅ Check manifest.json content_scripts section
- ✅ Verify file paths are correct
- ✅ Check for JavaScript syntax errors

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

## 🎯 **Quick Test Checklist**

- [ ] Extension reloaded
- [ ] Content script startup logs visible
- [ ] Extension status check working
- [ ] Test bot detection working
- [ ] Privacy risk simulation working
- [ ] Console shows bot detection logs
- [ ] Popup shows bot statistics
- [ ] Background script receiving messages
