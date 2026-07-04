import React, { useState } from 'react';
import { Calendar, MapPin, ExternalLink, Lightbulb, Check, Plus, RefreshCw } from 'lucide-react';
import { TravelEvent } from '../types';

interface EventsViewProps {
  events: TravelEvent[];
  isLoading: boolean;
  selectedItems: any[];
  onToggleSelection: (item: any, type: string) => void;
  onRefreshEvents: (dates: string, interests: string) => void;
  isRefreshing: boolean;
}

export default function EventsView({
  events,
  isLoading,
  selectedItems,
  onToggleSelection,
  onRefreshEvents,
  isRefreshing
}: EventsViewProps) {
  const [customDates, setCustomDates] = useState('upcoming week');
  const [customInterests, setCustomInterests] = useState('festivals, culture, markets');

  const isSelected = (name: string) => {
    return selectedItems.some((item) => item.name === name);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onRefreshEvents(customDates, customInterests);
  };

  if (isLoading) {
    return (
      <div id="events-loading" className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse space-y-4">
        <div className="h-6 w-1/4 bg-slate-800 rounded" />
        <div className="h-24 bg-slate-800/60 rounded-xl" />
        <div className="h-24 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  return (
    <div id="events-view-container" className="space-y-6">
      
      {/* Title & Refinement Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-display">Live Events & Festivals</h2>
            <p className="text-slate-400 text-sm">Real happenings discovered in real-time across regional listings</p>
          </div>
        </div>

        {/* Date Filter Panel */}
        <form onSubmit={handleUpdate} className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2">
            <input
              id="event-date-input"
              type="text"
              value={customDates}
              onChange={(e) => setCustomDates(e.target.value)}
              placeholder="e.g. July 2026, upcoming week"
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:border-amber-500 focus:outline-none w-36"
              title="Filter by dates"
            />
            <input
              id="event-interest-input"
              type="text"
              value={customInterests}
              onChange={(e) => setCustomInterests(e.target.value)}
              placeholder="e.g. food, markets, concerts"
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:border-amber-500 focus:outline-none w-44"
              title="Filter by interests"
            />
          </div>
          <button
            id="refresh-events-btn"
            type="submit"
            disabled={isRefreshing}
            className="p-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {events.length === 0 ? (
        <div id="events-empty" className="p-12 text-center rounded-2xl bg-slate-900/20 border border-slate-800/50">
          <Calendar className="mx-auto text-slate-600 mb-4" size={40} />
          <h3 className="text-white font-semibold mb-1">No Active Events Discovered</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Try broadening your search term (e.g. "summer" or "all happenings") to fetch other seasonal activities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt, idx) => {
            const selected = isSelected(evt.name);
            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between relative group">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full mb-1">
                        <Calendar size={10} /> {evt.date}
                      </span>
                      <h4 className="text-white font-bold text-base group-hover:text-amber-300 transition-colors">{evt.name}</h4>
                    </div>

                    <button
                      onClick={() => onToggleSelection(evt, 'event')}
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

                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{evt.description}</p>

                  <div className="p-3.5 bg-slate-950 border border-slate-800/60 rounded-xl mb-4">
                    <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                      <Lightbulb size={14} />
                      <span className="text-[11px] font-bold font-mono uppercase tracking-wider">AI RECOMMENDATION REASONING</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed italic">"{evt.llmReasoning}"</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-500" />
                    <span className="text-slate-300 truncate max-w-[220px]" title={evt.location}>{evt.location}</span>
                  </div>
                  {evt.url && (
                    <a
                      href={evt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <span>Event Info</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
