import React from 'react';
import { Star, MapPin, Clock, DollarSign, Gem, Compass, BookOpen, Plus, Check } from 'lucide-react';
import { Attraction } from '../types';

interface AttractionsViewProps {
  mainstream: Attraction[];
  hiddenGems: Attraction[];
  isLoading: boolean;
  selectedItems: any[];
  onToggleSelection: (item: any, type: string) => void;
  onReadStory: (placeName: string) => void;
}

export default function AttractionsView({
  mainstream,
  hiddenGems,
  isLoading,
  selectedItems,
  onToggleSelection,
  onReadStory
}: AttractionsViewProps) {

  const isSelected = (name: string) => {
    return selectedItems.some((item) => item.name === name);
  };

  if (isLoading) {
    return (
      <div id="attractions-loading" className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-slate-800 rounded" />
          <div className="h-32 bg-slate-800/60 rounded-xl" />
          <div className="h-32 bg-slate-800/60 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-48 bg-slate-800 rounded" />
          <div className="h-32 bg-slate-800/60 rounded-xl" />
          <div className="h-32 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (mainstream.length === 0 && hiddenGems.length === 0) {
    return (
      <div id="attractions-empty" className="p-12 text-center rounded-2xl bg-slate-900/20 border border-slate-800/50">
        <Compass className="mx-auto text-slate-600 mb-4" size={40} />
        <h3 className="text-white font-semibold mb-1">Local Sights & Secrets</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Unveil popular landmarks and well-kept secret spots.
        </p>
      </div>
    );
  }

  return (
    <div id="attractions-view-container" className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mainstream Sights */}
        <div id="mainstream-sights" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Compass className="text-teal-400" size={20} />
            <h3 className="text-lg font-bold text-white font-display">Iconic Highlights</h3>
            <span className="ml-auto text-xs font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">Must-See</span>
          </div>

          <div className="space-y-4">
            {mainstream.map((attr, idx) => {
              const selected = isSelected(attr.name);
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="inline-block text-[10px] font-bold font-mono tracking-wider text-teal-400 uppercase bg-teal-500/10 px-2 py-0.5 rounded-full mb-1">
                          {attr.theme}
                        </span>
                        <h4 className="text-white font-bold text-base group-hover:text-teal-300 transition-colors">{attr.name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleSelection(attr, 'attraction')}
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
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{attr.description}</p>
                  </div>

                  {/* Practical details bar */}
                  <div className="pt-4 border-t border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-slate-300">{attr.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Clock size={12} className="text-slate-500 shrink-0" />
                      <span className="truncate" title={attr.openingHours}>{attr.openingHours || 'Varies'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={12} className="text-slate-500" />
                      <span>{attr.approximateCost || 'Free'}</span>
                    </div>
                    <button
                      onClick={() => onReadStory(attr.name)}
                      className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium cursor-pointer transition-colors"
                    >
                      <BookOpen size={12} />
                      <span>Hear Story</span>
                    </button>
                  </div>

                  <div className="mt-2.5 text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{attr.address}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hidden Gems Sights */}
        <div id="hidden-gems-sights" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Gem className="text-amber-400 animate-pulse" size={20} />
            <h3 className="text-lg font-bold text-white font-display">Hidden Gems & Local Secrets</h3>
            <span className="ml-auto text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Overlooked</span>
          </div>

          <div className="space-y-4">
            {hiddenGems.map((attr, idx) => {
              const selected = isSelected(attr.name);
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-amber-500/20 transition-all flex flex-col justify-between group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.04),transparent_60%)]" />
                  
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="inline-block text-[10px] font-bold font-mono tracking-wider text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full mb-1">
                          {attr.theme || 'Authentic Local Spot'}
                        </span>
                        <h4 className="text-white font-bold text-base group-hover:text-amber-300 transition-colors">{attr.name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleSelection(attr, 'attraction')}
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
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mb-3">{attr.description}</p>
                    
                    {attr.whySpecial && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-4">
                        <span className="text-[10px] font-mono font-bold text-amber-400 block mb-0.5 uppercase">Why it's special / Why it's overlooked:</span>
                        <p className="text-slate-300 text-xs italic leading-relaxed">"{attr.whySpecial}"</p>
                      </div>
                    )}
                  </div>

                  {/* Practical details bar */}
                  <div className="pt-4 border-t border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-slate-300">{attr.rating?.toFixed(1) || '4.8'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Clock size={12} className="text-slate-500 shrink-0" />
                      <span className="truncate" title={attr.openingHours}>{attr.openingHours || 'Varies'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={12} className="text-slate-500" />
                      <span>{attr.approximateCost || 'Free'}</span>
                    </div>
                    <button
                      onClick={() => onReadStory(attr.name)}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium cursor-pointer transition-colors"
                    >
                      <BookOpen size={12} />
                      <span>Hear Story</span>
                    </button>
                  </div>

                  <div className="mt-2.5 text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{attr.address}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
