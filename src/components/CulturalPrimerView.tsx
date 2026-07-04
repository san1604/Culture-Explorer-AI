import React from 'react';
import { BookOpen, AlertCircle, MessageSquare, Flame, MapPin, Heart, Landmark, HelpCircle } from 'lucide-react';
import { CulturalPrimer } from '../types';

interface CulturalPrimerViewProps {
  destination: string;
  primer: CulturalPrimer | null;
  isLoading: boolean;
}

export default function CulturalPrimerView({ destination, primer, isLoading }: CulturalPrimerViewProps) {
  if (isLoading) {
    return (
      <div id="primer-loading" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-slate-800 rounded-full" />
          <div className="h-4 w-48 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-slate-800/60 rounded-xl" />
          <div className="h-28 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!primer) {
    return (
      <div id="primer-empty" className="p-12 text-center rounded-2xl bg-slate-900/20 border border-slate-800/50">
        <BookOpen className="mx-auto text-slate-600 mb-4" size={40} />
        <h3 className="text-white font-semibold mb-1">Cultural Primer</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Explore deep local insights, custom protocols, languages, and culinary specialties.
        </p>
      </div>
    );
  }

  return (
    <div id="cultural-primer-container" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-display">Cultural Primer</h2>
            <p className="text-slate-400 text-sm">Authentic local customs, verified traditions & etiquette guidelines</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-800">
          Source: Google Search Grounded
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Etiquette Protocol */}
        <div id="primer-etiquette" className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-amber-400 mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> ETIQUETTE & CUSTOMS
            </h3>
            <ul className="space-y-3">
              {primer.etiquette.map((item, idx) => (
                <li key={idx} className="text-slate-300 text-sm leading-relaxed flex gap-2.5">
                  <span className="text-amber-500 font-mono font-bold">0{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>Verify local expectations before arriving</span>
          </div>
        </div>

        {/* Phrases & Greetings */}
        <div id="primer-greetings" className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-teal-400 mb-4 flex items-center gap-2">
              <MessageSquare size={16} /> ESSENTIAL GREETINGS
            </h3>
            <div className="space-y-4">
              {primer.greetings.map((greet, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 hover:border-teal-500/20 transition-all">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-teal-400 font-bold font-display text-base">"{greet.phrase}"</span>
                    <span className="text-slate-500 text-xs font-mono">{greet.translation}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{greet.context}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Speaking even basic phrases shows high respect for local heritage.
          </div>
        </div>

        {/* Heritage Sites & Traditions */}
        <div id="primer-heritage" className="lg:col-span-4 space-y-4">
          {/* UNESCO or National Heritage Sites */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 mb-3.5 flex items-center gap-2">
              <Landmark size={16} /> HERITAGE & LANDMARKS
            </h3>
            {primer.unescoSites && primer.unescoSites.length > 0 ? (
              <ul className="space-y-2.5">
                {primer.unescoSites.map((site, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{site}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-xs italic">
                No major UNESCO designations found nearby, but packed with rich regional history.
              </p>
            )}
          </div>

          {/* Core Traditions */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm font-bold font-mono tracking-wider text-purple-400 mb-3 flex items-center gap-2">
              <Heart size={16} /> CORE TRADITIONS
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {primer.traditions.map((trad, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>{trad}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Culinary Staples (Bento / Grid) */}
      <div id="primer-culinary" className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-sm font-bold font-mono tracking-wider text-amber-400 mb-4 flex items-center gap-2">
          <Flame size={16} /> CULINARY HERITAGE & STAPLES
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {primer.culinaryStaples.map((dish, idx) => (
            <div key={idx} className="p-4 bg-slate-950 border border-slate-800/80 hover:border-amber-500/20 rounded-xl transition-all">
              <h4 className="text-white font-semibold text-sm mb-1">{dish.name}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{dish.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
