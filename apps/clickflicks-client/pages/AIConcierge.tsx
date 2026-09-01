import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Icons } from '../components/ui/icons';
import { ChatMessage } from '../types';
import { usePhotographers } from '../hooks/usePhotographers';

const AIConcierge: React.FC = () => {
  const { photographers } = usePhotographers();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello! I am your personal concierge for ClickFlicks. I can help you find the perfect photographer for your wedding, corporate event, or personal shoot in Ghana. What do you need today?',
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
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY || (process as any).env?.GEMINI_API_KEY; 
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
        setTimeout(() => {
             const topArtists = photographers.slice(0, 2).map(p => `${p.name} (${p.category} in ${p.location})`).join(' and ');
             const simResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: topArtists 
                  ? `Based on our live platform database, verified masters such as ${topArtists} are available for booking. What date and style do you have in mind?`
                  : "I am ready to match you with top visual artists across Ghana. Please specify your desired occasion, location, or budget!",
                timestamp: Date.now()
             };
             setMessages(prev => [...prev, simResponse]);
             setIsLoading(false);
        }, 1200);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const context = `You are a helpful assistant for ClickFlicks, a photography marketplace in Ghana. 
      Here is the list of available photographers from our verified database: ${JSON.stringify(photographers.map(p => ({name: p.name, category: p.category, location: p.location, rate: p.hourlyRate, tier: p.tier})))}.
      
      User request: ${userMsg.text}
      
      Recommend photographers from the list if they match. Be concise and friendly. Mention prices in GHS.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: context,
      });

      const text = response.text;
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text || "I'm having trouble connecting right now. Please browse our Explore page to see all artists.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error processing your request. Please try searching in Explore.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-20">
      <div className="bg-gradient-to-r from-brand-DEFAULT to-brand-dark p-6 pt-8 rounded-b-[30px] shadow-lg mb-2">
        <div className="flex items-center space-x-3 text-white">
            <div className="bg-white/20 p-2 rounded-full">
                <Icons.Sparkles size={24} />
            </div>
            <div>
                <h1 className="font-bold text-lg">AI Concierge</h1>
                <p className="text-xs text-brand-light opacity-90">Powered by Gemini</p>
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
                  ? 'bg-brand-DEFAULT text-white rounded-tr-none'
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
            placeholder="Ask for a photographer..."
            className="w-full bg-gray-50 border border-gray-200 py-3.5 pl-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT focus:border-transparent text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-brand-DEFAULT text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConcierge;
