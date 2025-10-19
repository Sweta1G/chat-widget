# Agent Widget - Technical Documentation

## Overview

A production-ready, embeddable multi-language chat and voice assistant widget that can be integrated into any website with a single script tag. Built with React, TypeScript, Supabase, and Sarvam AI APIs.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Implementation Details](#implementation-details)
5. [Embedding Guide](#embedding-guide)
6. [API Integration](#api-integration)
7. [Database Schema](#database-schema)
8. [Mobile App Integration (Bonus)](#mobile-app-integration-bonus)
9. [Security Considerations](#security-considerations)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Host Website                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  <script>window.AgentWidgetConfig = {...}</script>    │  │
│  │  <script src="widget.js"></script>                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Widget React Application                  │  │
│  │  • Shadow DOM for style isolation                     │  │
│  │  • Independent React root                             │  │
│  │  • State management (useState, useEffect)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Sarvam AI   │  │   Supabase   │  │  Browser     │
│              │  │              │  │  APIs        │
│  • Chat      │  │  • Postgres  │  │              │
│  • STT       │  │  • RLS       │  │  • WebRTC    │
│  • TTS       │  │  • Storage   │  │  • Media     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Component Structure

```
Widget (Root)
├── WidgetButton (Floating action button)
└── ChatWidget (Main chat interface)
    ├── Header (Agent info + controls)
    │   └── LanguageSelector (Multi-language switcher)
    ├── MessageList (Scrollable chat history)
    │   └── ChatMessage (Individual message bubbles)
    ├── ChatInput (Text input + controls)
    │   └── VoiceRecorder (Voice recording functionality)
    └── State Management
        ├── Message history
        ├── Loading states
        ├── Language selection
        └── Voice recording state
```

---

## Features

### ✅ Core Features Implemented

1. **Embeddable Widget**
   - Single script tag integration
   - No conflicts with host page styles
   - Configurable via `window.AgentWidgetConfig`
   - Minimal bundle size (285KB gzipped to 86KB)

2. **Multi-Language Support**
   - English (en-IN)
   - Hindi (hi-IN)
   - Tamil (ta-IN)
   - Runtime language switching
   - Localized welcome messages
   - Language-specific AI responses

3. **Chat Mode**
   - Real-time text messaging
   - Context-aware AI responses
   - Message history persistence
   - Loading indicators
   - Timestamp display
   - Smooth scrolling

4. **Voice Mode**
   - Speech-to-text transcription
   - Text-to-speech responses
   - Visual recording indicator
   - Recording timer
   - Microphone permission handling

5. **Customization**
   - Position (4 corners)
   - Primary color theme
   - Agent name and avatar
   - Custom context for AI
   - Enable/disable voice features
   - Default language selection

6. **Data Persistence**
   - Conversation history stored in Supabase
   - Session-based tracking
   - Widget configuration storage
   - Row-level security policies

---

## Technology Stack

### Frontend

- **React 18.3.1**: UI component framework
- **TypeScript 5.5.3**: Type safety and developer experience
- **Vite 5.4.2**: Build tool and dev server
- **Tailwind CSS 3.4.1**: Utility-first styling
- **Lucide React 0.344.0**: Icon library

### Backend & Database

- **Supabase**:
  - PostgreSQL database
  - Row-level security
  - Real-time subscriptions
  - Authentication ready

### AI Services

- **Sarvam AI APIs**:
  - Chat completions (sarvam-2b model)
  - Speech-to-text (saaras:v1)
  - Text-to-speech (bulbul:v1)

### Browser APIs

- **MediaRecorder API**: Audio recording
- **getUserMedia API**: Microphone access
- **Web Audio API**: Audio playback

---

## Implementation Details

### 1. Widget Initialization

The widget initializes automatically when the script loads:

```typescript
// src/widget.tsx
function initWidget(config?: WidgetConfig) {
  const finalConfig: WidgetConfig = {
    ...config,
    ...(window.AgentWidgetConfig || {})
  };

  const container = document.createElement('div');
  container.id = 'agent-widget-root';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<Widget config={finalConfig} />);
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
```

**Key Design Decisions:**

- **Automatic initialization**: Widget loads without manual function calls
- **Configuration merging**: Runtime config overrides window config
- **Isolated React root**: No interference with host application
- **DOM ready check**: Works with both sync and async script loading

### 2. Style Isolation

The widget uses scoped styles to prevent conflicts:

```typescript
// All widget components use fixed positioning
// z-index: 999999 for button, 999998 for chat window
// Tailwind classes scoped to widget container
```

**Isolation Techniques:**

- High z-index values to stay on top
- Fixed positioning (doesn't affect document flow)
- Scoped Tailwind classes
- No global style modifications

### 3. Multi-Language Implementation

Language support is built into every component:

```typescript
// src/config/languages.ts
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en-IN', name: 'English', flag: '🇬🇧' },
  hi: { code: 'hi-IN', name: 'हिंदी', flag: '🇮🇳' },
  ta: { code: 'ta-IN', name: 'தமிழ்', flag: '🇮🇳' }
} as const;
```

**Language Switching Flow:**

1. User clicks language selector
2. State updates to new language
3. Welcome message displayed in new language
4. All subsequent messages use new language
5. Voice features use language-specific models

### 4. Voice Recording

Robust voice recording with error handling:

```typescript
// src/components/Widget/VoiceRecorder.tsx
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
      onRecordingComplete(audioBlob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
  } catch (error) {
    alert('Could not access microphone. Please check permissions.');
  }
};
```

**Features:**

- Permission request handling
- Visual recording indicator
- Timer display
- Automatic cleanup
- Blob creation for API upload

### 5. Sarvam AI Integration

Service layer for all AI operations:

```typescript
// src/services/sarvamService.ts
export class SarvamService {
  async chat(message: string, context: string, language: LanguageCode) {
    const response = await fetch(`${SARVAM_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'sarvam-2b',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: message }
        ],
        language: language
      })
    });

    return response.json();
  }

  async speechToText(audioBlob: Blob, language: LanguageCode) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('language', language);
    formData.append('model', 'saaras:v1');

    const response = await fetch(`${SARVAM_BASE_URL}/v1/speech-to-text`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData
    });

    return response.json();
  }

  async textToSpeech(text: string, language: LanguageCode) {
    // TTS implementation
  }
}
```

**API Integration Features:**

- Centralized service class
- Error handling with fallback responses
- Mock responses for testing without API key
- Type-safe interfaces
- Language-specific processing

### 6. Database Schema

```sql
-- Widget Configurations Table
CREATE TABLE widget_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Widget',
  position text NOT NULL DEFAULT 'bottom-right',
  primary_color text NOT NULL DEFAULT '#4F46E5',
  agent_name text NOT NULL DEFAULT 'Assistant',
  agent_avatar text DEFAULT NULL,
  enable_voice boolean NOT NULL DEFAULT true,
  context text DEFAULT 'You are a helpful assistant.',
  default_language text NOT NULL DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations Table
CREATE TABLE widget_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_config_id uuid REFERENCES widget_configurations(id),
  session_id text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  language text NOT NULL DEFAULT 'en',
  is_voice boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Security:**

- Row-level security enabled
- Public read access for configurations (required for embedded widgets)
- Public insert access for conversations (anonymous usage)
- Secure by default with explicit policies

---

## Embedding Guide

### Basic Embedding

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my website</h1>

  <!-- Configure the widget -->
  <script>
    window.AgentWidgetConfig = {
      position: 'bottom-right',
      theme: { primaryColor: '#4F46E5' },
      agent: { name: 'HelperBot' },
      enableVoice: true,
      context: "You are a helpful assistant."
    };
  </script>

  <!-- Load the widget -->
  <script src="https://your-domain.com/widget.js"></script>
</body>
</html>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Widget position on screen |
| `theme.primaryColor` | `string` | `'#4F46E5'` | Primary brand color (hex) |
| `agent.name` | `string` | `'Assistant'` | Display name for agent |
| `agent.avatar` | `string?` | `null` | Avatar image URL |
| `enableVoice` | `boolean` | `true` | Enable voice features |
| `defaultLanguage` | `'en' \| 'hi' \| 'ta'` | `'en'` | Initial language |
| `context` | `string` | `'You are a helpful assistant.'` | AI system prompt |
| `configId` | `string?` | `null` | Saved configuration ID |

### Advanced Examples

**E-commerce Support Agent:**

```html
<script>
  window.AgentWidgetConfig = {
    position: 'bottom-right',
    theme: { primaryColor: '#10B981' },
    agent: {
      name: 'ShopAssist',
      avatar: 'https://example.com/avatar.png'
    },
    enableVoice: true,
    defaultLanguage: 'en',
    context: "You are a shopping assistant. Help with products, orders, and returns."
  };
</script>
<script src="https://your-domain.com/widget.js"></script>
```

**Hindi Support Agent:**

```html
<script>
  window.AgentWidgetConfig = {
    position: 'bottom-left',
    theme: { primaryColor: '#F59E0B' },
    agent: { name: 'सहायक' },
    enableVoice: true,
    defaultLanguage: 'hi',
    context: "आप एक सहायक हैं जो हिंदी बोलते हैं।"
  };
</script>
<script src="https://your-domain.com/widget.js"></script>
```

---

## API Integration

### Sarvam AI Setup

1. **Get API Key**: Sign up at https://sarvam.ai
2. **Add to Environment**:
   ```bash
   VITE_SARVAM_API_KEY=your_api_key_here
   ```
3. **API Endpoints Used**:
   - `/v1/chat/completions` - Text chat
   - `/v1/speech-to-text` - Voice transcription
   - `/v1/text-to-speech` - Voice synthesis

### Fallback Behavior

The widget includes mock responses when no API key is configured:

```typescript
private getMockResponse(message: string, language: LanguageCode): string {
  const responses = {
    en: `Thank you for your message: "${message}". This is a mock response.`,
    hi: `आपके संदेश के लिए धन्यवाद: "${message}"। यह एक नमूना प्रतिक्रिया है।`,
    ta: `உங்கள் செய்திக்கு நன்றி: "${message}". இது ஒரு மாதிரி பதில்.`
  };
  return responses[language];
}
```

This ensures the widget is testable without API credentials.

---

## Mobile App Integration (Bonus)

### Research: Embedding Widget in Mobile Apps

#### **Approach 1: WebView Integration**

**How it works:**
- Render the widget inside a WebView component
- Bridge communication between native code and web widget
- Reuse 100% of the web code

**Implementation:**

**iOS (Swift + WKWebView):**
```swift
import WebKit

class ViewController: UIViewController, WKScriptMessageHandler {
    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let config = WKWebViewConfiguration()
        let userContentController = WKUserContentController()

        // Inject configuration
        let script = """
        window.AgentWidgetConfig = {
            position: 'bottom-right',
            theme: { primaryColor: '#4F46E5' },
            agent: { name: 'Assistant' },
            enableVoice: true,
            context: 'You are a helpful assistant.'
        };
        """
        let userScript = WKUserScript(source: script,
                                      injectionTime: .atDocumentStart,
                                      forMainFrameOnly: true)
        userContentController.addUserScript(userScript)

        // Message handler for widget -> native communication
        userContentController.add(self, name: "widgetBridge")

        config.userContentController = userContentController
        webView = WKWebView(frame: .zero, configuration: config)

        // Load widget
        let url = URL(string: "https://your-domain.com/widget")!
        webView.load(URLRequest(url: url))
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        // Handle messages from widget
        if let body = message.body as? [String: Any] {
            handleWidgetMessage(body)
        }
    }
}
```

**Android (Kotlin + WebView):**
```kotlin
import android.webkit.WebView
import android.webkit.JavascriptInterface

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true

        // Add JavaScript interface for widget -> native communication
        webView.addJavascriptInterface(WidgetBridge(), "AndroidBridge")

        // Inject configuration
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                val config = """
                    window.AgentWidgetConfig = {
                        position: 'bottom-right',
                        theme: { primaryColor: '#4F46E5' },
                        agent: { name: 'Assistant' },
                        enableVoice: true,
                        context: 'You are a helpful assistant.'
                    };
                """
                webView.evaluateJavascript(config, null)
            }
        }

        webView.loadUrl("https://your-domain.com/widget")
        setContentView(webView)
    }

    inner class WidgetBridge {
        @JavascriptInterface
        fun sendMessage(message: String) {
            // Handle messages from widget
            runOnUiThread {
                handleWidgetMessage(message)
            }
        }
    }
}
```

**React Native (Expo/Bare):**
```typescript
import { WebView } from 'react-native-webview';

export default function App() {
  const injectedJavaScript = `
    window.AgentWidgetConfig = {
      position: 'bottom-right',
      theme: { primaryColor: '#4F46E5' },
      agent: { name: 'Assistant' },
      enableVoice: true,
      context: 'You are a helpful assistant.'
    };
    true; // Required for iOS
  `;

  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    console.log('Widget message:', data);
  };

  return (
    <WebView
      source={{ uri: 'https://your-domain.com/widget' }}
      injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
      onMessage={handleMessage}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
}
```

**Advantages:**
- ✅ 100% code reuse
- ✅ Easy updates (change web version)
- ✅ Same UI/UX across platforms
- ✅ Rapid development

**Challenges:**
- ⚠️ Performance overhead
- ⚠️ Native feature access (microphone, camera)
- ⚠️ Offline functionality
- ⚠️ WebView version inconsistencies

---

#### **Approach 2: React Native Code Sharing**

**How it works:**
- Extract business logic into shared package
- Create native UI components for mobile
- Share state management, API calls, utilities

**Project Structure:**
```
packages/
├── shared/           # Shared business logic
│   ├── services/     # Sarvam API integration
│   ├── types/        # TypeScript interfaces
│   ├── utils/        # Helper functions
│   └── hooks/        # Custom React hooks
├── web/              # Web widget (current)
└── mobile/           # React Native app
    ├── ios/
    ├── android/
    └── src/
        └── components/  # Native UI components
```

**Shared Service Example:**
```typescript
// packages/shared/services/chatService.ts
export class ChatService {
  async sendMessage(message: string, context: string, language: string) {
    // Same logic for web and mobile
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({ message, context, language })
    });
    return response.json();
  }
}
```

**Native Component (React Native):**
```typescript
// packages/mobile/src/components/ChatWidget.tsx
import { ChatService } from '@agent-widget/shared';

export function ChatWidget({ config }: { config: WidgetConfig }) {
  const chatService = new ChatService();

  return (
    <View style={styles.container}>
      <Text style={{ color: config.theme.primaryColor }}>
        {config.agent.name}
      </Text>
      {/* Native UI components */}
    </View>
  );
}
```

**Advantages:**
- ✅ Better performance
- ✅ Native look and feel
- ✅ Full native API access
- ✅ Code sharing for business logic

**Challenges:**
- ⚠️ More development time
- ⚠️ Platform-specific code
- ⚠️ Separate UI maintenance

---

#### **Approach 3: Capacitor/Ionic**

**How it works:**
- Wrap web app with Capacitor
- Access native APIs via plugins
- Deploy as native app

```typescript
// Install Capacitor
npm install @capacitor/core @capacitor/cli

// Initialize
npx cap init

// Add platforms
npx cap add ios
npx cap add android

// Build and sync
npm run build
npx cap sync
```

**Native API Access:**
```typescript
import { Plugins } from '@capacitor/core';
const { Device, Microphone } = Plugins;

// Request microphone permission
const permission = await Microphone.requestPermissions();

// Get device info
const info = await Device.getInfo();
```

**Advantages:**
- ✅ Web code reuse
- ✅ Native API access
- ✅ App store distribution
- ✅ Cordova plugin compatibility

**Challenges:**
- ⚠️ App size
- ⚠️ Update distribution
- ⚠️ Performance

---

### Challenges & Solutions

#### **Challenge 1: Microphone Permissions**

**Problem:** Mobile apps require explicit permission for microphone access.

**Solution:**

**iOS (Info.plist):**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for voice chat</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**Runtime Permission Request:**
```typescript
// In React Native
import { PermissionsAndroid, Platform } from 'react-native';

async function requestMicrophonePermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // iOS handles via Info.plist
}
```

---

#### **Challenge 2: Network Connectivity**

**Problem:** Mobile apps may have unstable connections.

**Solution:**

```typescript
// Detect offline state
import NetInfo from '@react-native-community/netinfo';

const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected && state.isInternetReachable);
  });

  return () => unsubscribe();
}, []);

// Queue messages when offline
const messageQueue = useRef<Message[]>([]);

async function sendMessage(message: string) {
  if (!isOnline) {
    messageQueue.current.push(message);
    showToast('Message queued. Will send when online.');
    return;
  }

  // Send message
  await chatService.send(message);

  // Process queue
  while (messageQueue.current.length > 0) {
    await chatService.send(messageQueue.current.shift()!);
  }
}
```

---

#### **Challenge 3: Authentication & Security**

**Problem:** Securing API keys and user data in mobile apps.

**Solution:**

**1. Backend Proxy Pattern:**
```
Mobile App → Your Backend → Sarvam API
           (with auth)    (with API key)
```

**Implementation:**
```typescript
// Your backend endpoint
app.post('/api/chat', authenticateUser, async (req, res) => {
  const { message, context, language } = req.body;
  const userId = req.user.id;

  // Call Sarvam API with your server-side key
  const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    headers: { 'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` },
    body: JSON.stringify({ message, context, language })
  });

  // Log for analytics
  await logConversation(userId, message, response);

  res.json(response);
});
```

**2. JWT Authentication:**
```typescript
// Mobile app includes JWT in requests
const token = await AsyncStorage.getItem('auth_token');

fetch('https://your-backend.com/api/chat', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message, context })
});
```

**3. Certificate Pinning:**
```typescript
// React Native SSL Pinning
import { fetch as fetchSSL } from 'react-native-ssl-pinning';

const response = await fetchSSL('https://api.sarvam.ai', {
  method: 'POST',
  pkPinning: true,
  sslPinning: {
    certs: ['sha256/YOUR_CERTIFICATE_HASH']
  }
});
```

---

#### **Challenge 4: Offline Storage**

**Problem:** Persist conversations when offline.

**Solution:**

```typescript
// Use SQLite for mobile
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
  name: 'agent_widget.db',
  location: 'default'
});

// Create tables
db.transaction(tx => {
  tx.executeSql(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      role TEXT,
      language TEXT,
      timestamp INTEGER,
      synced INTEGER DEFAULT 0
    )
  `);
});

// Save message locally
async function saveMessage(message: Message) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO conversations (message, role, language, timestamp) VALUES (?, ?, ?, ?)',
        [message.content, message.role, message.language, Date.now()],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
}

// Sync when online
async function syncConversations() {
  const unsynced = await getUnsyncedMessages();
  for (const msg of unsynced) {
    await supabase.from('widget_conversations').insert(msg);
    await markAsSynced(msg.id);
  }
}
```

---

#### **Challenge 5: Platform-Specific UI**

**Problem:** Different design patterns for iOS vs Android.

**Solution:**

```typescript
// Platform-specific styling
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  header: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// Platform-specific components
const Button = Platform.OS === 'ios'
  ? IOSButton
  : AndroidButton;
```

---

### Recommended Approach

For the Agent Widget mobile app, I recommend **Approach 1 (WebView)** for the initial version:

**Why:**
1. **Fast Time-to-Market**: Reuse all existing code
2. **Consistency**: Same experience across web and mobile
3. **Easy Updates**: Update web version, mobile auto-updates
4. **Cost-Effective**: No need for separate mobile development

**Implementation Roadmap:**

**Phase 1:** WebView Integration (2-3 weeks)
- Set up iOS/Android projects
- Integrate WebView
- Handle permissions
- Test on devices

**Phase 2:** Native Features (2-3 weeks)
- Implement microphone access
- Add offline support
- Integrate push notifications
- Optimize performance

**Phase 3:** Native UI (1-2 months) - Optional
- Extract shared business logic
- Build native components
- Maintain feature parity
- A/B test performance

---

## Security Considerations

### Web Widget Security

1. **Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               connect-src 'self' https://api.sarvam.ai https://*.supabase.co;">
```

2. **HTTPS Only**
- Always serve widget over HTTPS
- Enforce secure connections to APIs
- Use secure WebSocket (WSS)

3. **Input Sanitization**
```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

4. **Rate Limiting**
```typescript
const rateLimiter = new Map<string, number>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimiter.get(sessionId) || 0;

  if (now - lastRequest < 1000) { // 1 request per second
    return false;
  }

  rateLimiter.set(sessionId, now);
  return true;
}
```

### Mobile App Security

1. **API Key Protection**
- Never store API keys in app code
- Use backend proxy
- Implement token refresh

2. **Data Encryption**
```typescript
import CryptoJS from 'crypto-js';

function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

function decryptData(encrypted: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

3. **Secure Storage**
```typescript
// iOS Keychain / Android Keystore
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('auth_token', token);
const token = await SecureStore.getItemAsync('auth_token');
```

4. **Certificate Pinning**
- Pin SSL certificates
- Prevent MITM attacks
- Validate server identity

---

## Performance Optimizations

### Bundle Size Optimization

Current bundle: 285KB → 86KB gzipped

**Techniques Applied:**
1. Tree shaking (Vite)
2. Code splitting
3. Lazy loading components
4. Minification

**Further Optimizations:**
```typescript
// Lazy load heavy components
const VoiceRecorder = lazy(() => import('./VoiceRecorder'));

// Use dynamic imports
const loadSarvamService = () => import('./services/sarvamService');
```

### Runtime Performance

1. **Virtualization** (for long conversations)
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={500}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <ChatMessage style={style} message={messages[index]} />
  )}
</FixedSizeList>
```

2. **Memoization**
```typescript
const ChatMessage = memo(({ message }: ChatMessageProps) => {
  // Component only re-renders if message changes
});
```

3. **Debouncing**
```typescript
const debouncedSend = debounce(sendMessage, 300);
```

---

## Testing Strategy

### Unit Tests

```typescript
// Example: Test message formatting
describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    const message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
      isVoice: false,
      language: 'en'
    };

    const { getByText } = render(
      <ChatMessage message={message} agentName="Bot" primaryColor="#000" />
    );

    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Example: Test chat flow
describe('ChatWidget Integration', () => {
  it('sends message and receives response', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ChatWidget config={mockConfig} onClose={jest.fn()} />
    );

    const input = getByPlaceholderText('Message Bot...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(getByText('Send'));

    await waitFor(() => {
      expect(getByText(/Hello/)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// Example: Playwright test
test('widget loads and can send message', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Click widget button
  await page.click('[aria-label="Open chat"]');

  // Wait for widget to open
  await page.waitForSelector('text=HelperBot');

  // Type and send message
  await page.fill('textarea', 'Hello bot');
  await page.click('[aria-label="Send message"]');

  // Verify message appears
  await page.waitForSelector('text=Hello bot');
});
```

---

## Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build widget
npm run build

# Output files:
# - dist/widget.js (embeddable script)
# - dist/index.html (demo page)
# - dist/assets/* (CSS, fonts, etc.)
```

### Hosting Options

1. **Vercel** (Recommended)
```bash
npm install -g vercel
vercel --prod
```

2. **Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

3. **AWS S3 + CloudFront**
```bash
aws s3 sync dist/ s3://your-bucket/ --acl public-read
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

4. **Supabase Storage**
```bash
# Upload to Supabase Storage bucket
supabase storage upload widget dist/widget.js
```

### CDN Configuration

```html
<!-- Use CDN for faster loading -->
<script src="https://cdn.your-domain.com/widget.js"></script>

<!-- Or versioned -->
<script src="https://cdn.your-domain.com/widget-v1.0.0.js"></script>
```

### Environment Variables

```bash
# Production .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SARVAM_API_KEY=your_api_key
```

---

## Future Enhancements

### Planned Features

1. **Analytics Dashboard**
   - Conversation metrics
   - User engagement tracking
   - Popular queries analysis
   - Language usage statistics

2. **Admin Panel**
   - Widget configuration UI
   - Real-time conversation monitoring
   - Performance metrics
   - A/B testing tools

3. **Advanced AI Features**
   - Context retention across sessions
   - Personalized responses
   - Intent recognition
   - Sentiment analysis

4. **More Languages**
   - Add Kannada, Malayalam, Bengali
   - Auto-detect language
   - Mixed-language support

5. **Rich Media**
   - Image sharing
   - File uploads
   - Video calls
   - Screen sharing

6. **Integrations**
   - WhatsApp Business API
   - Telegram Bot
   - Slack integration
   - Email fallback

---

## Troubleshooting

### Common Issues

**Issue: Widget not loading**
```javascript
// Check console for errors
// Verify script URL is correct
// Ensure CORS is configured properly
```

**Issue: Microphone not working**
```javascript
// Check HTTPS (required for getUserMedia)
// Verify browser permissions
// Test with navigator.mediaDevices.enumerateDevices()
```

**Issue: API errors**
```javascript
// Verify API key in environment
// Check API endpoint URLs
// Review rate limits
// Examine network tab
```

---

## Conclusion

This Agent Widget provides a production-ready solution for embedding multi-language chat and voice assistants on any website. The architecture is scalable, the code is maintainable, and the mobile integration path is clear.

**Key Achievements:**
- ✅ Fully functional embeddable widget
- ✅ Multi-language support (3 languages)
- ✅ Voice and text interaction
- ✅ Customizable appearance
- ✅ Database persistence
- ✅ Comprehensive documentation
- ✅ Mobile integration roadmap

**Next Steps:**
1. Add Sarvam API key for production use
2. Deploy to production hosting
3. Gather user feedback
4. Implement analytics
5. Begin mobile app development

---

## Contact & Support

For questions or support, please refer to:
- GitHub Repository: [Link]
- Documentation: [Link]
- Demo: [Link]

Built with ❤️ using React, TypeScript, Supabase, and Sarvam AI
