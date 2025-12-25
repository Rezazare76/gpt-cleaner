# GPT Cleaner

Fix ChatGPT lagging in long conversations by keeping only the last N messages visible for faster performance.

## Overview

ChatGPT can start lagging in long conversations, especially when many messages are loaded in the UI.
GPT Cleaner solves this problem by keeping your ChatGPT interface fast and responsive.

**Important:**
This extension does NOT delete your conversations.
Messages are only removed from the user interface (UI) to improve performance.
Your full conversation remains safely stored in your ChatGPT account.

## Key Features

• Fixes ChatGPT lagging in long conversations
• Manually clean messages with a single click
• Automatically clean messages as new replies appear
• Choose how many recent messages to keep
• Works only on chatgpt.com
• No data collection, no tracking, no analytics

## How It Works

GPT Cleaner removes older messages only from the page display.
This reduces DOM size and improves scrolling, typing, and overall responsiveness.

All processing happens locally in your browser.
No data is sent to any server.

Perfect for users who use ChatGPT heavily and experience slow performance in long chats.

This extension is not affiliated with OpenAI.

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension should now be installed and visible in your extensions list

Alternatively, you can install it directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/gpt-cleaner/hfacaaadghabgmjokgnijdodlgfnnfdn?authuser=0&hl=en).

## Usage

1. Navigate to [chatgpt.com](https://chatgpt.com)
2. Click the GPT Cleaner extension icon in your browser toolbar
3. Set the number of recent messages you want to keep visible
4. Toggle "Auto clean" if you want automatic cleaning as new messages appear
5. Click "Run" to manually clean the current conversation

## Project Structure

- `manifest.json` - Chrome extension manifest
- `background.js` - Service worker for background tasks
- `content.js` - Content script that runs on ChatGPT pages
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `popup.css` - Popup styling
- `assets/` - Extension icons and assets

## Development

This is a Chrome extension built with Manifest V3. It uses:

- Content scripts for DOM manipulation
- Storage API for settings persistence
- Scripting API for dynamic script injection

## Creator

Created by [Reza Zare](https://www.linkedin.com/in/reza-zare-7327a8218/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
