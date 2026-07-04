import React, { useState, useEffect } from 'react';
import { 
  Compass, BookOpen, MapPin, Sparkles, Sliders, Calendar, Users, 
  ChevronRight, Heart, Share2, Printer, AlertTriangle, AlertCircle, RefreshCw, Flame, HelpCircle
} from 'lucide-react';
import { 
  discoverDestinations, 
  getDestinationDetails, 
  getAttractions, 
  getEvents, 
  getConnections, 
  generateDestinationImage 
} from './api';
import { Destination, CulturalPrimer, Attraction, TravelEvent, LocalConnection } from './types';

import SearchHero from './components/SearchHero';
import CulturalPrimerView from './components/CulturalPrimerView';
import AttractionsView from './components/AttractionsView';
import EventsView from './components/EventsView';
import ConnectionsView from './components/ConnectionsView';
import StorytellingView from './components/StorytellingView';
import ItineraryView from './components/ItineraryView';

export default function App() {
  // Global States
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  
  // Destination Details States
  const [primer, setPrimer] = useState<CulturalPrimer | null>(null);
  const [mainstream, setMainstream] = useState<Attraction[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Attraction[]>([]);
  const [events, setEvents] = useState<TravelEvent[]>([]);
  const [connections, setConnections] = useState<LocalConnection[]>([]);
  const [sceneryUrl, setSceneryUrl] = useState<string>('');
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'primer' | 'attractions' | 'events' | 'connections' | 'story' | 'itinerary'>('primer');
  const [storyPlace, setStoryPlace] = useState<string>('');
  
  // Trip Assembly State
  const [savedItems, setSavedItems] = useState<any[]>([]);

  // Refresh Event loading state
  const [isRefreshingEvents, setIsRefreshingEvents] = useState(false);
  const [isLoadingScenery, setIsLoadingScenery] = useState(false);
  const [failedTabs, setFailedTabs] = useState<Record<string, boolean>>({});

  // Initialize with some default discovered items if any, but start with empty states
  const handleSearch = async (query: string, filters: any) => {
    setIsSearching(true);
    setSearchError(null);
    setSelectedDest(null);
    setDestinations([]);
    setSearchQuery(query);

    try {
      const response = await discoverDestinations(query, filters);
      setDestinations(response.destinations);
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'Failed to search destinations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDestination = (dest: Destination) => {
    setSelectedDest(dest);
    setIsLoadingDetails(false);
    setDetailsError(null);
    setFailedTabs({});
    setActiveTab('primer');
    setStoryPlace('');
    
    // Clear old details
    setPrimer(null);
    setMainstream([]);
    setHiddenGems([]);
    setEvents([]);
    setConnections([]);
    setSceneryUrl('');
  };

  const handleRetryTab = () => {
    setDetailsError(null);
    setFailedTabs(prev => {
      const updated = { ...prev };
      delete updated[activeTab];
      return updated;
    });
  };

  // Resilient, dynamic tab-based lazy loading effect
  useEffect(() => {
    if (!selectedDest) return;

    // Load scenery background image if not loaded yet
    if (!sceneryUrl && !isLoadingScenery && !failedTabs['scenery']) {
      const loadScenery = async () => {
        setIsLoadingScenery(true);
        try {
          const url = await generateDestinationImage(`${selectedDest.name}, ${selectedDest.location} cultural scenery`);
          setSceneryUrl(url || 'none');
        } catch (err) {
          console.error("Scenery load failed:", err);
          setSceneryUrl('none'); // Prevent infinite loop on failure
          setFailedTabs(prev => ({ ...prev, scenery: true }));
        } finally {
          setIsLoadingScenery(false);
        }
      };
      loadScenery();
    }

    // Load tab-specific details on demand
    if (activeTab === 'primer' && !primer && !isLoadingDetails && !failedTabs['primer']) {
      const loadPrimer = async () => {
        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
          const res = await getDestinationDetails(selectedDest.name);
          setPrimer(res.culturalPrimer);
        } catch (err: any) {
          console.error(err);
          setDetailsError(err.message || 'Failed to load cultural primer details.');
          setFailedTabs(prev => ({ ...prev, primer: true }));
        } finally {
          setIsLoadingDetails(false);
        }
      };
      loadPrimer();
    } else if (activeTab === 'attractions' && mainstream.length === 0 && !isLoadingDetails && !failedTabs['attractions']) {
      const loadAttractions = async () => {
        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
          const res = await getAttractions(selectedDest.name, selectedDest.travelStyle?.[0] || 'general');
          setMainstream(res.mainstream || []);
          setHiddenGems(res.hiddenGems || []);
        } catch (err: any) {
          console.error(err);
          setDetailsError(err.message || 'Failed to load sights and gems.');
          setFailedTabs(prev => ({ ...prev, attractions: true }));
        } finally {
          setIsLoadingDetails(false);
        }
      };
      loadAttractions();
    } else if (activeTab === 'events' && events.length === 0 && !isLoadingDetails && !failedTabs['events']) {
      const loadEvents = async () => {
        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
          const res = await getEvents(selectedDest.name);
          setEvents(res.events || []);
        } catch (err: any) {
          console.error(err);
          setDetailsError(err.message || 'Failed to load upcoming events.');
          setFailedTabs(prev => ({ ...prev, events: true }));
        } finally {
          setIsLoadingDetails(false);
        }
      };
      loadEvents();
    } else if (activeTab === 'connections' && connections.length === 0 && !isLoadingDetails && !failedTabs['connections']) {
      const loadConnections = async () => {
        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
          const res = await getConnections(selectedDest.name);
          setConnections(res.connections || []);
        } catch (err: any) {
          console.error(err);
          setDetailsError(err.message || 'Failed to load artisan connections.');
          setFailedTabs(prev => ({ ...prev, connections: true }));
        } finally {
          setIsLoadingDetails(false);
        }
      };
      loadConnections();
    }
  }, [selectedDest, activeTab, primer, mainstream, events, connections, sceneryUrl, isLoadingScenery, isLoadingDetails, failedTabs]);

  // Saved Drawer Handlers
  const handleToggleSaveItem = (item: any, type: string) => {
    const name = item.name || item.provider;
    const exists = savedItems.some((s) => (s.name || s.provider) === name);
    if (exists) {
      setSavedItems(savedItems.filter((s) => (s.name || s.provider) !== name));
    } else {
      setSavedItems([...savedItems, { ...item, type }]);
    }
  };

  const handleRemoveSavedItem = (item: any) => {
    const name = item.name || item.provider;
    setSavedItems(savedItems.filter((s) => (s.name || s.provider) !== name));
  };

  const handleClearSavedItems = () => {
    setSavedItems([]);
  };

  // Custom folklore storyteller redirect
  const handleReadFolklore = (placeName: string) => {
    setStoryPlace(placeName);
    setActiveTab('story');
    // Scroll down to storytelling
    setTimeout(() => {
      document.getElementById('details-explorer')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Custom Refresh Events (e.g. different date / interest tags)
  const handleRefreshEvents = async (dates: string, interests: string) => {
    if (!selectedDest) return;
    setIsRefreshingEvents(true);
    try {
      const response = await getEvents(selectedDest.name, dates, interests);
      setEvents(response.events);
    } catch (err) {
      console.error("Refresh events error:", err);
    } finally {
      setIsRefreshingEvents(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/20 selection:text-teal-300">
      
      {/* Dynamic Ambient Blur Highlights */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full filter blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/3 rounded-full filter blur-[150px] pointer-events-none translate-y-1/3" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/10">
            <Compass className="text-slate-950" size={22} />
          </div>
          <div>
            <span className="text-xs font-bold font-mono tracking-widest text-teal-400 block uppercase leading-none">AI CHRONICLE</span>
            <span className="text-lg font-extrabold text-white font-display tracking-tight leading-none">Culture Explorer</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-500">SYSTEM STATUS:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Grounded Node Live
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 relative z-10">
        
        {/* Step 1: Search Form Component */}
        <SearchHero onSearch={handleSearch} isLoading={isSearching} />

        {/* Discovery Results / Matching Rationale */}
        {isSearching && (
          <div id="discovery-loading" className="space-y-4 py-8">
            <div className="flex items-center gap-2 text-teal-400 font-mono text-sm animate-pulse">
              <RefreshCw className="animate-spin" size={16} />
              <span>Interpreting travel intent & searching global registries...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 bg-slate-900/40 border border-slate-900 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {searchError && (
          <div id="search-error-box" className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{searchError}</span>
          </div>
        )}

        {/* Destinations list display */}
        {!isSearching && destinations.length > 0 && !selectedDest && (
          <div id="destinations-results" className="space-y-4">
            <h3 className="text-sm font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Sparkles size={14} className="text-teal-400" /> Discovered Destinations matching "{searchQuery}"
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((dest, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectDestination(dest)}
                  className="bg-slate-900 border border-slate-800/80 hover:border-teal-500/30 rounded-2xl p-6 transition-all hover:translate-y-[-2px] shadow-lg hover:shadow-teal-500/5 group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[10px] font-bold font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                        {dest.matchScore}% Match Score
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{dest.budgetLevel}</span>
                    </div>

                    <h4 className="text-white font-extrabold text-xl font-display group-hover:text-teal-300 transition-colors">
                      {dest.name}
                    </h4>
                    <p className="text-slate-400 text-xs flex items-center gap-1 mb-3">
                      <MapPin size={12} className="text-slate-500" /> {dest.location}
                    </p>

                    <p className="text-slate-300 text-sm mb-4 leading-relaxed line-clamp-3">
                      {dest.description}
                    </p>

                    <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl mb-4 text-xs italic text-teal-400/90 leading-relaxed">
                      "{dest.rationale}"
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {dest.travelStyle.map((style, sIdx) => (
                        <span key={sIdx} className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-800">
                          {style}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-850">
                      <span>Best: {dest.bestSeason}</span>
                      <span className="text-teal-400 font-semibold group-hover:translate-x-1 transition-all flex items-center gap-0.5">
                        Explore Soul <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Destination Deep Explorer Section */}
        {selectedDest && (
          <div id="details-explorer" className="space-y-8 scroll-mt-24">
            
            {/* Scenery Hero Card */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 h-[260px] md:h-[350px] shadow-2xl flex items-end">
              {sceneryUrl ? (
                <img 
                  src={sceneryUrl} 
                  alt={`${selectedDest.name} scenery`} 
                  className="absolute inset-0 w-full h-full object-cover opacity-65"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950" />
              )}
              {/* Cover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Destination Header Info Overlay */}
              <div className="relative z-10 p-6 md:p-10 w-full flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-teal-500 text-slate-950 uppercase">
                      ACTIVE CHRONICLE
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {selectedDest.budgetLevel} • Best Season: {selectedDest.bestSeason}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight">
                    {selectedDest.name}
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base flex items-center gap-1.5 mt-1">
                    <MapPin size={14} className="text-teal-400" /> {selectedDest.location}
                  </p>
                </div>

                {/* Back to search */}
                <button
                  id="back-to-discovery-btn"
                  onClick={() => setSelectedDest(null)}
                  className="px-4 py-2 bg-slate-950/80 hover:bg-slate-950 text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 backdrop-blur-sm self-start md:self-end transition-all cursor-pointer hover:border-slate-700"
                >
                  ← Select Other Discovered Places
                </button>
              </div>
            </div>

            {/* Sticky/Interactive Explorer Navigation Tab Rail */}
            <div className="flex items-center gap-1 border-b border-slate-850 overflow-x-auto pb-px">
              {(['primer', 'attractions', 'events', 'connections', 'story', 'itinerary'] as const).map((tab) => {
                const labelMap = {
                  primer: 'Cultural Primer',
                  attractions: 'Sights & Gems',
                  events: 'Upcoming Events',
                  connections: 'Artisan Connections',
                  story: 'Folklore Chronicles',
                  itinerary: 'Trip Assembly'
                };
                return (
                  <button
                    id={`tab-btn-${tab}`}
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3.5 text-xs font-bold font-mono tracking-wider border-b-2 transition-all shrink-0 uppercase cursor-pointer ${
                      activeTab === tab 
                        ? 'border-teal-500 text-teal-400 bg-teal-500/5' 
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
                    }`}
                  >
                    {labelMap[tab]}
                    {tab === 'itinerary' && savedItems.length > 0 && (
                      <span className="ml-1.5 bg-teal-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded text-[9px]">
                        {savedItems.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Tab View Rendering */}
            <div id="tab-content" className="bg-slate-950/20 border-slate-900 rounded-3xl min-h-[300px]">
              {isLoadingDetails ? (
                <div className="p-12 text-center space-y-4">
                  <RefreshCw className="animate-spin text-teal-400 mx-auto" size={32} />
                  <h4 className="text-white font-bold font-display">Parsing Regional Registries & Archival Logs...</h4>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                    Executing live search algorithms to guarantee verified local etiquette, hidden culinary guilds, ticketing links, and regional folklore...
                  </p>
                </div>
              ) : detailsError ? (
                <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex flex-col items-center gap-2">
                  <AlertCircle size={32} />
                  <h4 className="font-bold">Execution Halt</h4>
                  <p className="text-xs">{detailsError}</p>
                  <button 
                    onClick={handleRetryTab}
                    className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs font-mono border border-slate-800 text-slate-200"
                  >
                    Retry Query
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === 'primer' && (
                    <CulturalPrimerView 
                      destination={selectedDest.name}
                      primer={primer}
                      isLoading={isLoadingDetails}
                    />
                  )}

                  {activeTab === 'attractions' && (
                    <AttractionsView 
                      mainstream={mainstream}
                      hiddenGems={hiddenGems}
                      isLoading={isLoadingDetails}
                      selectedItems={savedItems}
                      onToggleSelection={handleToggleSaveItem}
                      onReadStory={handleReadFolklore}
                    />
                  )}

                  {activeTab === 'events' && (
                    <EventsView 
                      events={events}
                      isLoading={isLoadingDetails}
                      selectedItems={savedItems}
                      onToggleSelection={handleToggleSaveItem}
                      onRefreshEvents={handleRefreshEvents}
                      isRefreshing={isRefreshingEvents}
                    />
                  )}

                  {activeTab === 'connections' && (
                    <ConnectionsView 
                      connections={connections}
                      isLoading={isLoadingDetails}
                      selectedItems={savedItems}
                      onToggleSelection={handleToggleSaveItem}
                    />
                  )}

                  {activeTab === 'story' && (
                    <StorytellingView 
                      destination={selectedDest.name}
                      initialPlace={storyPlace}
                    />
                  )}

                  {activeTab === 'itinerary' && (
                    <ItineraryView 
                      destination={selectedDest.name}
                      selectedItems={savedItems}
                      onRemoveItem={handleRemoveSavedItem}
                      onClearSelections={handleClearSavedItems}
                    />
                  )}
                </>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer Credentials */}
      <footer className="mt-20 border-t border-slate-900 bg-slate-950/60 py-8 px-6 text-center text-xs text-slate-600 font-mono">
        <p className="mb-2">Destination Discovery & Cultural Experience Platform © 2026</p>
        <p>Built with Google Gemini models, Search Grounding SDK, and React-Tailwind styling</p>
      </footer>
    </div>
  );
}
