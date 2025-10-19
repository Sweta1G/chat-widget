import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize the widget configuration
    (window as any).AgentWidgetConfig = {
      position: 'bottom-right',
      theme: {
        primaryColor: '#4F46E5',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      agent: {
        name: 'SarvamBot',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SarvamBot'
      },
      enableVoice: true,
      defaultLanguage: 'en',
      context: "You are a helpful AI assistant powered by Sarvam AI. You can help users with their questions in multiple languages including English, Hindi, and Tamil."
    };
    <script src="agent-widget.js" defer></script>
    // Dynamically load the widget script
    const script = document.createElement('script');
    script.src = '/src/widget.tsx';
    script.type = 'module';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Sarvam AI Widget Demo
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Multi-language Chat & Voice Assistant Widget
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🚀 Try the Widget
            </h2>
            <p className="text-gray-600 mb-6">
              Click the floating button in the bottom-right corner to start chatting!
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Chat Mode</h3>
                  <p className="text-gray-600">Type your questions and get AI-powered responses</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🎤</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Voice Mode</h3>
                  <p className="text-gray-600">Speak to the assistant and hear voice replies</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Multi-Language</h3>
                  <p className="text-gray-600">Switch between English, Hindi, and Tamil</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📝 Widget Configuration
            </h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`window.AgentWidgetConfig = {
  position: 'bottom-right',
  theme: {
    primaryColor: '#4F46E5'
  },
  agent: {
    name: 'SarvamBot',
    avatar: 'https://...'
  },
  enableVoice: true,
  defaultLanguage: 'en',
  context: "You are a helpful AI assistant..."
};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;