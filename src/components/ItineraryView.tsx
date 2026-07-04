import React, { useState } from 'react';
import { Calendar, Compass, Clock, MapPin, Sparkles, Sliders, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Printer, AlertCircle } from 'lucide-react';
import { Itinerary, ItineraryDay } from '../types';
import { generateItinerary } from '../api';

interface ItineraryViewProps {
  destination: string;
  selectedItems: any[];
  onRemoveItem: (item: any) => void;
  onClearSelections: () => void;
}

export default function ItineraryView({
  destination,
  selectedItems,
  onRemoveItem,
  onClearSelections
}: ItineraryViewProps) {
  const [duration, setDuration] = useState('3 Days');
  const [pace, setPace] = useState('balanced');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<number[]>([1]); // Expand Day 1 by default

  const handleBuildItinerary = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least 1 attraction, event, or connection first.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateItinerary(destination, selectedItems, duration, pace);
      setItinerary(response.itinerary);
      // Automatically expand all days
      const dayNums = response.itinerary.days.map((d) => d.dayNumber);
      setExpandedDays(dayNums);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to assemble itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayExpand = (dayNum: number) => {
    if (expandedDays.includes(dayNum)) {
      setExpandedDays(expandedDays.filter((d) => d !== dayNum));
    } else {
      setExpandedDays([...expandedDays, dayNum]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'attraction': return 'border-teal-500/30 text-teal-400 bg-teal-500/10';
      case 'event': return 'border-amber-500/30 text-amber-400 bg-amber-500/10';
      case 'connection': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
      case 'meal': return 'border-orange-500/30 text-orange-400 bg-orange-500/10';
      case 'transit': return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
      default: return 'border-slate-800 text-slate-400 bg-slate-950';
    }
  };

  return (
    <div id="itinerary-assembly-panel" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-display">Custom Trip Assembler</h2>
            <p className="text-slate-400 text-sm">Sequence saved heritage spots, connections, & events into a coherent daily route</p>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <button
            id="clear-selections-btn"
            onClick={onClearSelections}
            className="text-xs font-mono font-bold text-red-400 hover:text-red-300 transition-colors border border-red-500/15 bg-red-500/5 px-3 py-1.5 rounded-lg cursor-pointer ml-auto"
          >
            Clear All Saved ({selectedItems.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of selections & Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Selections Rack */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 mb-4 uppercase">
              SAVED ITEMS FOR CHRONICLE ({selectedItems.length})
            </h3>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                <AlertCircle className="mx-auto text-slate-600 mb-2" size={24} />
                <p className="text-slate-500 text-xs px-4">
                  No items saved yet. Browse Sights, Hidden Gems, Events, or Local Experts and click "Save" to populate.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">
                        {item.isHiddenGem ? 'Hidden Gem' : item.provider ? 'Artisan Host' : item.date ? 'Event' : 'Attraction'}
                      </span>
                      <span className="text-slate-200 font-semibold block truncate">{item.name || item.provider}</span>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 font-mono text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assembly Parameter Options */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
              ROUTE SCHEDULING OPTIONS
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">TRIP LENGTH</label>
              <select
                id="itinerary-duration-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:border-teal-500 focus:outline-none"
              >
                <option value="1 Day">1 Day Quick-Trip</option>
                <option value="2 Days">2 Days Weekend Escape</option>
                <option value="3 Days">3 Days Exploration</option>
                <option value="5 Days">5 Days Immersion</option>
                <option value="7 Days">7 Days Slow Living</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">PACE</label>
              <select
                id="itinerary-pace-select"
                value={pace}
                onChange={(e) => setPace(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:border-teal-500 focus:outline-none"
              >
                <option value="relaxed">Relaxed (spacious buffers & pauses)</option>
                <option value="balanced">Balanced (optimized regional flow)</option>
                <option value="packed">Packed (fully loaded schedule)</option>
              </select>
            </div>

            <button
              id="assemble-route-btn"
              onClick={handleBuildItinerary}
              disabled={isLoading || selectedItems.length === 0}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Sequencing flow...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Assemble Optimized Itinerary</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-xs italic">{error}</p>
            )}
          </div>

        </div>

        {/* Right Column: Display of generated route */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center animate-pulse space-y-4 h-full min-h-[300px] flex flex-col justify-center">
              <RefreshCw className="mx-auto text-teal-400 animate-spin" size={32} />
              <h4 className="text-white font-bold font-display">Generating Optimal Travel Sequences</h4>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Consulting geographical distance coordinates, optimizing timings, inserting local food breaks, and injecting transit route options...
              </p>
            </div>
          ) : itinerary ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.05),transparent_70%)]" />

              {/* Title & summary header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
                <div>
                  <span className="text-[10px] font-bold font-mono tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full uppercase">
                    Curated Route Flow
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-display mt-1">{itinerary.title}</h3>
                </div>

                <button
                  id="print-itinerary-btn"
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all self-start"
                >
                  <Printer size={13} />
                  <span>Print Plan</span>
                </button>
              </div>

              {/* Summary Rationale */}
              <div className="p-4 bg-slate-950 border border-teal-500/10 rounded-2xl relative z-10">
                <span className="text-[10px] font-mono font-bold text-teal-400 block mb-1 uppercase tracking-wider">AI FLOW OPTIMIZATION ANALYSIS</span>
                <p className="text-slate-300 text-xs leading-relaxed">{itinerary.summary}</p>
              </div>

              {/* Day by Day collapse panel */}
              <div className="space-y-4">
                {itinerary.days.map((day: ItineraryDay, dayIdx) => {
                  const isExpanded = expandedDays.includes(day.dayNumber);
                  return (
                    <div key={dayIdx} className="border border-slate-800/80 rounded-2xl bg-slate-950/40 overflow-hidden">
                      {/* Day Accordion Header */}
                      <button
                        onClick={() => toggleDayExpand(day.dayNumber)}
                        className="w-full px-5 py-4 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-sm font-mono shrink-0">
                            {day.dayNumber}
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">DAY SCHEDULE</span>
                            <h4 className="text-white font-bold text-sm font-display tracking-wide">{day.theme}</h4>
                          </div>
                        </div>

                        <div className="text-slate-400">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {/* Day Activities List */}
                      {isExpanded && (
                        <div className="p-5 border-t border-slate-800/40 space-y-4">
                          <div className="relative border-l border-slate-800/80 ml-3.5 pl-6 space-y-6">
                            {day.activities.map((act, actIdx) => (
                              <div key={actIdx} className="relative group">
                                {/* Bullet indicator */}
                                <div className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${
                                  act.type === 'attraction' ? 'bg-teal-400' :
                                  act.type === 'event' ? 'bg-amber-400' :
                                  act.type === 'connection' ? 'bg-emerald-400' :
                                  act.type === 'meal' ? 'bg-orange-400' : 'bg-blue-400'
                                }`} />

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="text-xs font-mono font-semibold text-teal-400 bg-teal-500/5 px-2 py-0.5 rounded border border-teal-500/10">
                                      {act.timeSlot}
                                    </span>
                                    <h5 className="text-white font-bold text-sm">{act.title}</h5>
                                    <span className="text-[9px] font-mono text-slate-500 uppercase">{act.type}</span>
                                  </div>

                                  <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">{act.description}</p>

                                  {act.routingInsight && (
                                    <div className="text-[11px] text-teal-400 flex items-start gap-1 font-sans mt-1 bg-teal-500/5 p-1 px-2 rounded border border-teal-500/10 w-fit">
                                      <span className="font-bold font-mono">Routing Insight:</span>
                                      <span>{act.routingInsight}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Day Expert Insight */}
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-2.5 mt-2">
                            <CheckCircle2 size={14} className="text-teal-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[9px] font-mono font-bold text-teal-400 block uppercase">EXPERT LOCAL INSIGHT</span>
                              <p className="text-slate-300 text-xs leading-relaxed italic">"{day.dailyInsight}"</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div id="itinerary-intro" className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center h-full min-h-[300px] flex flex-col justify-center items-center">
              <Calendar className="text-slate-700 mb-3" size={48} />
              <h4 className="text-white font-bold font-display text-sm mb-1">Assemble Your Chronicle Route</h4>
              <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
                Add sights, secret landmarks, and connections to your saved drawer on the left, choose your travel pacing, and assemble an optimized itinerary!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
