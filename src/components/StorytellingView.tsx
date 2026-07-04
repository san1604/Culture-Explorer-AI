import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Send, Sparkles, User, ShieldAlert, FileText, ArrowRight, CornerDownRight } from 'lucide-react';
import { ChatMessage, StoryResponse } from '../types';
import { getStory } from '../api';

interface StorytellingViewProps {
  destination: string;
  initialPlace?: string;
}

export default function StorytellingView({ destination, initialPlace = '' }: StorytellingViewProps) {
  const [targetPlace, setTargetPlace] = useState(initialPlace);
  const [mode, setMode] = useState<'historian' | 'local' | 'poetic' | 'kids'>('local');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<{ title: string; url: string }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTargetPlace(initialPlace);
  }, [initialPlace]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleModeChange = (newMode: 'historian' | 'local' | 'poetic' | 'kids') => {
    setMode(newMode);
    // Restart chat or append context
    setChatHistory([]);
    setCitations([]);
  };

  const handleGenerateStory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getStory(destination, targetPlace, mode, []);
      setChatHistory([
        { role: 'model', text: response.story }
      ]);
      setCitations(response.citations || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsgText = inputMessage;
    setInputMessage('');
    
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', text: userMsgText }
    ];
    setChatHistory(updatedHistory);
    setIsLoading(true);
    setError(null);

    try {
      const response = await getStory(destination, targetPlace, mode, updatedHistory);
      setChatHistory([
        ...updatedHistory,
        { role: 'model', text: response.story }
      ]);
      // Append citations
      if (response.citations && response.citations.length > 0) {
        setCitations((prev) => {
          const combined = [...prev, ...response.citations];
          return Array.from(new Map(combined.map((item) => [item.url, item])).values());
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="storytelling-container" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
      {/* Header Panel */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="text-white font-bold text-base font-display flex items-center gap-1.5">
              <span>Oral Legends & Folk Chronicles</span>
              <Sparkles size={14} className="text-amber-400" />
            </h3>
            <p className="text-slate-400 text-xs">Immersive history of "{destination}" {targetPlace ? `• ${targetPlace}` : ''}</p>
          </div>
        </div>

        {/* Persona Select */}
        <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['local', 'historian', 'poetic', 'kids'] as const).map((p) => (
            <button
              id={`persona-${p}`}
              key={p}
              onClick={() => handleModeChange(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                mode === p 
                  ? 'bg-teal-500 text-slate-950' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Target Focus Input Panel (if any) */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/20 flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0">CHRONICLE FOCUS:</span>
        <input
          id="target-place-input"
          type="text"
          value={targetPlace}
          onChange={(e) => setTargetPlace(e.target.value)}
          placeholder={`e.g. Specific castle, neighborhood, or general "${destination}" heritage`}
          className="bg-transparent border-none text-slate-200 text-xs focus:ring-0 focus:outline-none flex-1 placeholder-slate-600"
        />
        {chatHistory.length === 0 && (
          <button
            id="start-chronicle-btn"
            onClick={handleGenerateStory}
            disabled={isLoading}
            className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-lg font-bold hover:bg-teal-500 hover:text-slate-950 transition-all uppercase shrink-0 cursor-pointer"
          >
            Commence Narrative
          </button>
        )}
      </div>

      {/* Narrative Feed */}
      <div id="narrative-feed" className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/40">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <BookOpen size={48} className="text-slate-700 mb-3 animate-pulse" />
            <h4 className="text-white font-semibold text-sm mb-1">Select a chronicle focus above</h4>
            <p className="text-slate-500 text-xs max-w-sm">
              Press "Commence Narrative" to let our local guides, poets, or historians paint a vivid, factual picture.
            </p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center border ${
                msg.role === 'user' 
                  ? 'bg-slate-800 border-slate-700 text-teal-400' 
                  : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-slate-200 rounded-tr-none'
                  : 'bg-slate-900 text-slate-300 border border-slate-800/80 rounded-tl-none whitespace-pre-wrap font-sans'
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0 h-9 w-9 flex items-center justify-center animate-pulse">
              <Sparkles size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 rounded-tl-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs font-mono text-slate-500 ml-2">Grounding claims with live search records...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Citations Bar (Grounding Proof) */}
      {citations.length > 0 && (
        <div id="citations-panel" className="px-5 py-2.5 bg-slate-950 border-t border-slate-850 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span className="font-bold font-mono tracking-wider text-teal-500 uppercase">Factual Grounding Citations:</span>
          {citations.map((cit, idx) => (
            <a
              key={idx}
              href={cit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-400 hover:border-teal-500/20 transition-all flex items-center gap-1 shrink-0"
            >
              <FileText size={10} />
              <span className="max-w-[120px] truncate">{cit.title}</span>
            </a>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
        <input
          id="chat-message-input"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={chatHistory.length === 0 ? "Commence narrative above or ask a general folklore question..." : "Ask a follow-up folklore or regional history question..."}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none placeholder-slate-600"
          disabled={isLoading}
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
