import React, { useState } from 'react';
import { Search, SlidersHorizontal, MapPin, Compass, DollarSign, Calendar, Users, Flame } from 'lucide-react';

interface SearchHeroProps {
  onSearch: (query: string, filters: any) => void;
  isLoading: boolean;
}

export default function SearchHero({ onSearch, isLoading }: SearchHeroProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [budget, setBudget] = useState('Any');
  const [tripLength, setTripLength] = useState('Any');
  const [travelStyle, setTravelStyle] = useState('Any');
  const [season, setSeason] = useState('Any');
  const [groupType, setGroupType] = useState('Any');

  const popularSuggestions = [
    "quiet coastal towns in Portugal",
    "historic temples & food in Kyoto",
    "cultural walks in Oaxaca",
    "hidden alpine gems of Switzerland",
    "heritage trails of Rajasthan"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query, { budget, tripLength, travelStyle, season, groupType });
  };

  const selectSuggestion = (sug: string) => {
    setQuery(sug);
    onSearch(sug, { budget, tripLength, travelStyle, season, groupType });
  };

  return (
    <div id="search-hero" className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.06),transparent_50%)]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 text-xs font-semibold tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center gap-1.5 uppercase font-mono">
            <Compass size={12} className="animate-spin-slow" /> Real-Time Search Grounding
          </span>
          <span className="px-3 py-1 text-xs font-semibold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 uppercase font-mono">
            <Flame size={12} /> Live Generative AI
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-display mb-4">
          Unveil the Soul of <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300">Any Destination</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
          Type any town, country, or even a vague travel mood. We ground generative models with live search data to craft authentic cultural journeys, hidden gems, and local connections.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 text-slate-500" size={20} />
              <input
                id="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where to? (e.g. quiet fishing villages in Japan, cultural hub of Mexico, Oaxaca...)"
                className="w-full pl-12 pr-4 py-4 bg-slate-950/80 hover:bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-sans placeholder-slate-500"
                disabled={isLoading}
              />
            </div>
            <button
              id="submit-search"
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg hover:shadow-teal-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Compass size={20} />
                  <span>Discover Now</span>
                </>
              )}
            </button>
            <button
              id="toggle-filters"
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                showFilters 
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-500 font-mono">Inspirations:</span>
            {popularSuggestions.map((sug, idx) => (
              <button
                id={`suggestion-${idx}`}
                key={idx}
                type="button"
                onClick={() => selectSuggestion(sug)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-slate-800/40 text-slate-400 border border-slate-800/60 hover:text-teal-400 hover:border-teal-500/30 hover:bg-slate-800/80 transition-all font-sans cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div id="filter-panel" className="p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-400 mb-2 flex items-center gap-1">
                  <DollarSign size={12} className="text-teal-500" /> BUDGET
                </label>
                <select
                  id="filter-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="Any">Any Vibe</option>
                  <option value="Budget">Budget Backpacking</option>
                  <option value="Mid-range">Balanced / Mid-range</option>
                  <option value="Luxury">Luxe & Comfort</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-400 mb-2 flex items-center gap-1">
                  <Calendar size={12} className="text-teal-500" /> TRIP DURATION
                </label>
                <select
                  id="filter-length"
                  value={tripLength}
                  onChange={(e) => setTripLength(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="Any">Any Duration</option>
                  <option value="Weekend">Weekend Escape (2-3 Days)</option>
                  <option value="Week">Full Week (7 Days)</option>
                  <option value="Extended">Slow Travel (14+ Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-400 mb-2 flex items-center gap-1">
                  <Compass size={12} className="text-teal-500" /> TRAVEL STYLE
                </label>
                <select
                  id="filter-style"
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="Any">Any Focus</option>
                  <option value="Adventure">Active Adventure</option>
                  <option value="Relaxation">Rest & Slow Living</option>
                  <option value="Heritage">Heritage & History</option>
                  <option value="Food">Culinary & Dining</option>
                  <option value="Nightlife">Vibrant Nightlife</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-400 mb-2 flex items-center gap-1">
                  <Calendar size={12} className="text-teal-500" /> SEASON
                </label>
                <select
                  id="filter-season"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="Any">Any Season</option>
                  <option value="Spring">Springtime</option>
                  <option value="Summer">Summer Vibe</option>
                  <option value="Autumn">Autumn Foliage</option>
                  <option value="Winter">Winter Magic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-400 mb-2 flex items-center gap-1">
                  <Users size={12} className="text-teal-500" /> GROUP TYPE
                </label>
                <select
                  id="filter-grouptype"
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="Any">Any Group</option>
                  <option value="Solo">Solo Traveler</option>
                  <option value="Couple">Romantic Couple</option>
                  <option value="Family">Family Friendly</option>
                  <option value="Friends">Group of Friends</option>
                </select>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
