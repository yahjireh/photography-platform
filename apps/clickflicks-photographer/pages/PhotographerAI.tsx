import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Icons } from '../components/ui/icons';
import { ChatMessage } from '../types';

const PhotographerAI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Greetings Master Artist. I am your Gemini Studio Assistant. I can assist you with pricing recommendations for Ghanaian events, contract drafting, client negotiation scripts, and session planning. How can I optimize your studio today?',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY; 
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
        // Fallback simulation if no key provided
        setTimeout(() => {
             const simResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "For a full-day traditional wedding in Accra, standard professional rates range between GHS 3,500 and GHS 6,000 including 2 shooters and lighting assistants. I recommend offering tiered packages with drone coverage included.",
                timestamp: Date.now()
             };
             setMessages(prev => [...prev, simResponse]);
             setIsLoading(false);
        }, 1500);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const context = `You are a high-level creative business consultant for professional photographers and media studios in Ghana using the ClickFlicks platform. 
      Help the vendor with market pricing in GHS, shoot prep, lighting diagrams, client communication, and contract clauses. Be concise, authoritative, and helpful.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nVendor inquiry: ${userMsg.text}`,
      });

      const text = response.text;
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text || "I'm having trouble analyzing studio intelligence right now. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error connecting to Gemini Studio Intelligence.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-20">
      <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-black p-6 pt-8 rounded-b-[30px] shadow-lg mb-2 text-white">
        <div className="flex items-center space-x-3">
            <div className="bg-brand-DEFAULT/20 p-2 rounded-full border border-brand-DEFAULT/40">
                <Icons.Sparkles size={24} className="text-brand-light" />
            </div>
            <div>
                <h1 className="font-bold text-lg">Studio Assistant</h1>
                <p className="text-xs text-brand-light opacity-90">Gemini Intelligence for Creators</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for pricing advice, contract clauses..."
            className="w-full bg-gray-50 border border-gray-200 py-3.5 pl-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT focus:border-transparent text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-gray-900 text-brand-light rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotographerAI;
