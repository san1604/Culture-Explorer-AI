export interface Destination {
  name: string;
  location: string;
  rationale: string;
  matchScore: number;
  description: string;
  travelStyle: string[];
  budgetLevel: string;
  bestSeason: string;
}

export interface CulturalPrimer {
  etiquette: string[];
  greetings: {
    phrase: string;
    translation: string;
    context: string;
  }[];
  culinaryStaples: {
    name: string;
    description: string;
  }[];
  traditions: string[];
  unescoSites: string[];
}

export interface Attraction {
  name: string;
  theme: string;
  description: string;
  openingHours: string;
  rating: number;
  approximateCost: string;
  address: string;
  isHiddenGem: boolean;
  whySpecial?: string;
}

export interface TravelEvent {
  name: string;
  date: string;
  description: string;
  location: string;
  url?: string;
  llmReasoning: string;
}

export interface LocalConnection {
  provider: string;
  type: string; // e.g. workshop, homestay, guided walk, artisan
  description: string;
  outreachDraft: string;
  recommendedQuestions: string[];
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  activities: {
    timeSlot: string; // e.g. "09:00 AM - 11:30 AM"
    title: string;
    type: 'attraction' | 'event' | 'connection' | 'meal' | 'transit';
    description: string;
    routingInsight?: string;
  }[];
  dailyInsight: string;
}

export interface Itinerary {
  title: string;
  days: ItineraryDay[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface StoryResponse {
  story: string;
  citations: {
    title: string;
    url: string;
  }[];
}
