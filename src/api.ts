import { Destination, CulturalPrimer, Attraction, TravelEvent, LocalConnection, Itinerary, ChatMessage, StoryResponse } from "./types";

export async function discoverDestinations(
  query: string,
  filters: { budget?: string; tripLength?: string; travelStyle?: string; season?: string; groupType?: string }
): Promise<{ destinations: Destination[]; cached: boolean }> {
  const response = await fetch("/api/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, filters }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to discover destinations");
  }
  return response.json();
}

export async function getDestinationDetails(destination: string): Promise<{ culturalPrimer: CulturalPrimer; cached: boolean }> {
  const response = await fetch("/api/destination-details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to retrieve cultural details");
  }
  return response.json();
}

export async function getAttractions(
  destination: string,
  travelStyle?: string
): Promise<{ mainstream: Attraction[]; hiddenGems: Attraction[]; cached: boolean }> {
  const response = await fetch("/api/attractions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, travelStyle }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to retrieve attractions");
  }
  return response.json();
}

export async function getEvents(
  destination: string,
  dates?: string,
  interests?: string
): Promise<{ events: TravelEvent[]; cached: boolean }> {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, dates, interests }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to retrieve events");
  }
  return response.json();
}

export async function getConnections(destination: string): Promise<{ connections: LocalConnection[]; cached: boolean }> {
  const response = await fetch("/api/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to retrieve local connections");
  }
  return response.json();
}

export async function getStory(
  destination: string,
  targetPlace: string,
  mode: "historian" | "local" | "poetic" | "kids",
  history: ChatMessage[]
): Promise<StoryResponse> {
  const response = await fetch("/api/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, targetPlace, mode, history }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate storytelling");
  }
  return response.json();
}

export async function generateItinerary(
  destination: string,
  selections: any[],
  dates: string,
  travelPace: string
): Promise<{ itinerary: Itinerary; cached: boolean }> {
  const response = await fetch("/api/itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, selections, dates, travelPace }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to build itinerary");
  }
  return response.json();
}

export async function generateDestinationImage(prompt: string): Promise<string> {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate image");
  }
  const data = await response.json();
  return data.imageUrl;
}
