import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAiResponse } from '../lib/geminiHelper';
import { appendAiMessage, clearAiChat, loadAiChat } from '../lib/aiChat';
import type { AiMessage } from '../lib/aiChat';

export default function Assistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || 'guest_user';

  // Load chat history on mount
  useEffect(() => {
    loadAiChat(userId).then(history => {
      setMessages(history);
    });
  }, [userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessageContent = text.trim();
    if (!textToSend) setInput('');
    setError(null);

    // 1. Save user message
    const updatedWithUser = await appendAiMessage(userId, 'user', userMessageContent);
    setMessages(updatedWithUser);
    setLoading(true);

    try {
      // 2. Prepare history format for Gemini
      const historyForApi = updatedWithUser.slice(-10, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 3. Get AI response from Gemini API
      const aiReply = await getAiResponse(userMessageContent, historyForApi);

      // 4. Save AI response
      const updatedWithAi = await appendAiMessage(userId, 'assistant', aiReply);
      setMessages(updatedWithAi);
    } catch (err: any) {
      console.error('AI Error:', err);
      setError(err.message || 'Error calling Gemini API. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearAiChat(userId);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-zinc-900">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            ←
          </button>
          <span className="font-semibold text-lg">🤖 Ask AI</span>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={handleClear} 
            className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 px-2 py-1 rounded border border-red-900/50"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-xl mb-2">👋 Hello! How can I help you today?</p>
            <p className="text-sm">Ask me anything about video creation, trends, or general topics.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-rose-600 text-white rounded-br-none'
                  : 'bg-zinc-800 text-gray-200 rounded-bl-none border border-zinc-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
              Hunar AI is thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="p-3 border-t border-gray-800 bg-zinc-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Apna sawal likhein..."
            className="flex-1 bg-black border border-zinc-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-rose-600 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-rose-600 text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-rose-700 disabled:opacity-50 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
