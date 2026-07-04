import React, { useState } from 'react';
import { Users, Mail, ClipboardCheck, Sparkles, MessageSquare, Plus, Check, HelpCircle } from 'lucide-react';
import { LocalConnection } from '../types';

interface ConnectionsViewProps {
  connections: LocalConnection[];
  isLoading: boolean;
  selectedItems: any[];
  onToggleSelection: (item: any, type: string) => void;
}

export default function ConnectionsView({
  connections,
  isLoading,
  selectedItems,
  onToggleSelection
}: ConnectionsViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isSelected = (name: string) => {
    return selectedItems.some((item) => item.provider === name);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) {
    return (
      <div id="connections-loading" className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse space-y-4">
        <div className="h-6 w-1/4 bg-slate-800 rounded" />
        <div className="h-32 bg-slate-800/60 rounded-xl" />
        <div className="h-32 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div id="connections-empty" className="p-12 text-center rounded-2xl bg-slate-900/20 border border-slate-800/50">
        <Users className="mx-auto text-slate-600 mb-4" size={40} />
        <h3 className="text-white font-semibold mb-1">Authentic Local Connections</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Engage directly with local artisans, workshops, and verified neighborhood experts.
        </p>
      </div>
    );
  }

  return (
    <div id="connections-view-container" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Authentic Connections</h2>
          <p className="text-slate-400 text-sm">Real guilds, workshops, and historical guides found live in this region</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {connections.map((conn, idx) => {
          const selected = isSelected(conn.provider);
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between relative group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-block text-[10px] font-bold font-mono tracking-wider text-teal-400 uppercase bg-teal-500/10 px-2.5 py-0.5 rounded-full mb-1">
                      {conn.type}
                    </span>
                    <h3 className="text-white font-extrabold text-lg font-display">{conn.provider}</h3>
                  </div>

                  <button
                    onClick={() => onToggleSelection(conn, 'connection')}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold ${
                      selected 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {selected ? <Check size={14} /> : <Plus size={14} />}
                    <span>{selected ? 'Added' : 'Save'}</span>
                  </button>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-4">{conn.description}</p>

                {/* Thoughtful local questions */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl mb-4">
                  <span className="text-[10px] font-mono font-bold text-teal-400 block mb-2 uppercase flex items-center gap-1.5">
                    <HelpCircle size={12} /> Thoughtful Questions to Ask Them
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {conn.recommendedQuestions.map((q, qIdx) => (
                      <li key={qIdx} className="flex gap-2">
                        <span className="text-teal-500 font-bold">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Draft intro message */}
                <div className="p-4 bg-slate-950/80 border border-teal-500/10 rounded-xl relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <Sparkles size={12} /> Curated Introductory Outreach Draft
                    </span>
                    <button
                      onClick={() => handleCopy(conn.outreachDraft, idx)}
                      className="text-[10px] font-mono text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <ClipboardCheck size={12} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Mail size={12} />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed italic border-l-2 border-teal-500/20 pl-3">
                    {conn.outreachDraft}
                  </p>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
