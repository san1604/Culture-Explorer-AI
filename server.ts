import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache with TTL (10 minutes)
interface CacheEntry {
  data: any;
  expiry: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getCacheKey = (endpoint: string, body: any): string => {
  return `${endpoint}:${JSON.stringify(body)}`;
};

const getFromCache = (key: string): any | null => {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    console.log(`[Cache Hit] Key: ${key}`);
    return entry.data;
  }
  if (entry) {
    console.log(`[Cache Expired] Key: ${key}`);
    cache.delete(key);
  }
  return null;
};

const setInCache = (key: string, data: any) => {
  console.log(`[Cache Set] Key: ${key}`);
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL,
  });
};

// Lazy-initialized Gemini Client
let _aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!_aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets."
      );
    }
    _aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return _aiClient;
}

// Resilient API Call wrapper with exponential backoff retry for transient 429/quota limits
// Also automatically disables Google Search Grounding if quota/rate limit error occurs.
async function robustGenerateContent(
  options: { model: string; contents: any; config?: any },
  retries = 3,
  delay = 1500,
  hasSearchGrounding = true
): Promise<any> {
  const ai = getGemini();
  const usesSearch = hasSearchGrounding && options.config?.tools?.some((t: any) => t.googleSearch);

  const finalConfig = { ...options.config };
  if (!usesSearch && finalConfig.tools) {
    finalConfig.tools = finalConfig.tools.filter((t: any) => !t.googleSearch);
    if (finalConfig.tools.length === 0) {
      delete finalConfig.tools;
    }
  }

  try {
    return await ai.models.generateContent({
      model: options.model,
      contents: options.contents,
      config: finalConfig
    });
  } catch (error: any) {
    const isRateLimit =
      error?.status === 429 ||
      error?.statusCode === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("RESOURCE_EXHAUSTED") ||
      error?.message?.includes("quota") ||
      error?.status === "RESOURCE_EXHAUSTED" ||
      error?.message?.includes("Quota exceeded") ||
      error?.message?.includes("Rate limit");

    if (isRateLimit) {
      // If we had search grounding enabled, try removing it first!
      if (usesSearch) {
        console.warn(`[Gemini API] Quota/Rate limit hit with search grounding. Retrying IMMEDIATELY without Google Search Grounding...`);
        return robustGenerateContent(options, retries, delay, false);
      }

      // If we already stripped search grounding or didn't have it, retry with delay
      if (retries > 0) {
        console.warn(`[Gemini API Rate Limit] Caught 429 or quota limit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return robustGenerateContent(options, retries - 1, delay * 2, false);
      }
    }
    throw error;
  }
}

// Centralized error handler to map API errors (especially 429 RESOURCE_EXHAUSTED) into polite user-facing guidance
function handleRouteError(res: any, error: any, defaultMsg: string) {
  console.error(`${defaultMsg}:`, error);
  const isRateLimit =
    error?.status === 429 ||
    error?.statusCode === 429 ||
    error?.message?.includes("429") ||
    error?.message?.includes("RESOURCE_EXHAUSTED") ||
    error?.message?.includes("quota") ||
    error?.status === "RESOURCE_EXHAUSTED";

  if (isRateLimit) {
    return res.status(429).json({
      error: "The system is currently experiencing high demand or your Gemini API key has temporarily exceeded its quota limits. Please click back to select other places, switch tabs, or try again in a few seconds."
    });
  }
  return res.status(500).json({ error: error.message || defaultMsg });
}

// 1. Destination Discovery Endpoint
app.post("/api/discover", async (req, res) => {
  const cacheKey = getCacheKey("/api/discover", req.body);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const { query, filters = {} } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const ai = getGemini();

    const prompt = `Find and recommend a list of 4-5 real, specific destinations (cities, towns, regions) matching the traveler's request.
User Query: "${query}"
Filters:
- Budget Level: ${filters.budget || "Any"}
- Trip Duration: ${filters.tripLength || "Any"}
- Travel Style: ${filters.travelStyle || "Any"}
- Season/Time: ${filters.season || "Any"}
- Group Type: ${filters.groupType || "Any"}

Provide a short, distinct traveler rationale (1-2 sentences) for why each destination matches their query and style. Provide a match score from 70 to 99, a short description, matching travel styles (array of tags), budget level, and best season to visit.
Strictly output a JSON array of objects conforming to the requested schema. Use web search grounding to find accurate, real destinations.`;

    const response = await robustGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the destination city or town" },
              location: { type: Type.STRING, description: "Region and Country, e.g. Algarve, Portugal" },
              rationale: { type: Type.STRING, description: "Tailored reason why this is an ideal match for this traveler query" },
              matchScore: { type: Type.INTEGER, description: "Confidence score from 70 to 100" },
              description: { type: Type.STRING, description: "An elegant, sensory overview description of the vibe" },
              travelStyle: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Matching themes, e.g., Coastal, Historic, Adventure" },
              budgetLevel: { type: Type.STRING, description: "Budget vibe (Budget, Mid-range, Luxury)" },
              bestSeason: { type: Type.STRING, description: "Best time of year to visit" }
            },
            required: ["name", "location", "rationale", "matchScore", "description", "travelStyle", "budgetLevel", "bestSeason"]
          }
        }
      }
    });

    const resultText = response.text?.trim() || "[]";
    const parsed = JSON.parse(resultText);
    setInCache(cacheKey, { destinations: parsed });
    return res.json({ destinations: parsed, cached: false });
  } catch (error: any) {
    return handleRouteError(res, error, "Discovery error");
  }
});

// 2. Cultural Primer Endpoint
app.post("/api/destination-details", async (req, res) => {
  const cacheKey = getCacheKey("/api/destination-details", req.body);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const { destination } = req.body;
    if (!destination) {
      return res.status(400).json({ error: "Destination is required" });
    }

    const ai = getGemini();

    const prompt = `Generate a comprehensive cultural primer and local heritage details for "${destination}".
Include:
1. Etiquette rules (dress codes, tipping, local customs, respect practices).
2. Essential local greetings or expressions (phrases, translations, and when/how to say them).
3. Culinary staples (local specialty dishes, craft/food traditions, and descriptions).
4. Major local cultural traditions, music, arts, or annual festivities.
5. Dynamically search for and verify real, recognized UNESCO World Heritage sites or national heritage landmarks in or very close to "${destination}".

Use Google Search grounding to ensure absolute factual accuracy for customs, phrases, and UNESCO status. Return a strict JSON response.`;

    const response = await robustGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            etiquette: { type: Type.ARRAY, items: { type: Type.STRING } },
            greetings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ["phrase", "translation", "context"]
              }
            },
            culinaryStaples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            },
            traditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            unescoSites: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["etiquette", "greetings", "culinaryStaples", "traditions", "unescoSites"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    setInCache(cacheKey, { culturalPrimer: parsed });
    return res.json({ culturalPrimer: parsed, cached: false });
  } catch (error: any) {
    return handleRouteError(res, error, "Details error");
  }
});

// 3. Attractions & Hidden Gems Endpoint
app.post("/api/attractions", async (req, res) => {
  const cacheKey = getCacheKey("/api/attractions", req.body);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const { destination, travelStyle = "general" } = req.body;
    if (!destination) {
      return res.status(400).json({ error: "Destination is required" });
    }

    const ai = getGemini();

    const prompt = `Using live search grounding, search for real, actual attractions and landmarks in "${destination}" tailored for a "${travelStyle}" travel style.
Produce two lists:
1. "mainstream": The top 3-4 absolute must-see sights (museums, historic centers, viewpoints) with high visitor volume.
2. "hiddenGems": 3-4 overlooked, lesser-known, or highly authentic local spots. Identify them by looking for signals like lower global review counts but pristine ratings, blogs, or local forum mentions.

For each spot:
- Write an original, vivid, sensory micro-description (do not copy review texts).
- Write a custom "theme" banner (e.g. "for vintage lovers", "best at golden hour").
- Gather practical live details: verified opening hours, verified ratings, approximate admission cost/currency, address, and coordinates if possible.
- For hidden gems, write an evocative "whySpecial" paragraph explaining why it's overlooked and what makes it magical.

All places must be real and exists. Output a JSON payload strictly conforming to the requested schema.`;

    const response = await robustGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainstream: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  description: { type: Type.STRING },
                  openingHours: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  approximateCost: { type: Type.STRING },
                  address: { type: Type.STRING },
                  isHiddenGem: { type: Type.BOOLEAN }
                },
                required: ["name", "theme", "description", "openingHours", "rating", "approximateCost", "address", "isHiddenGem"]
              }
            },
            hiddenGems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  description: { type: Type.STRING },
                  openingHours: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  approximateCost: { type: Type.STRING },
                  address: { type: Type.STRING },
                  isHiddenGem: { type: Type.BOOLEAN },
                  whySpecial: { type: Type.STRING }
                },
                required: ["name", "theme", "description", "openingHours", "rating", "approximateCost", "address", "isHiddenGem", "whySpecial"]
              }
            }
          },
          required: ["mainstream", "hiddenGems"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    setInCache(cacheKey, parsed);
    return res.json({ ...parsed, cached: false });
  } catch (error: any) {
    return handleRouteError(res, error, "Attractions error");
  }
});

// 4. Local Events Endpoint
app.post("/api/events", async (req, res) => {
  const cacheKey = getCacheKey("/api/events", req.body);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const { destination, dates = "upcoming week", interests = "general" } = req.body;
    if (!destination) {
      return res.status(400).json({ error: "Destination is required" });
    }

    const ai = getGemini();

    const prompt = `Search the live web for real, upcoming public events, festivals, concerts, exhibitions, or markets taking place in "${destination}" around "${dates}" matching interest categories: "${interests}".
Do NOT return stale or fake events. Perform a live Google Search to locate real happenings.
For each event:
- Provide a real name and confirmed/expected date.
- Provide a clear, factual description.
- Provide the verified venue or location.
- Provide a source URL or ticket page if discovered.
- Provide an "llmReasoning" paragraph explaining why this event specifically matches the user's travel style/interest.

Output as a JSON array of objects conforming to the schema.`;

    const response = await robustGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              location: { type: Type.STRING },
              url: { type: Type.STRING, description: "Source URL or info page" },
              llmReasoning: { type: Type.STRING, description: "Personalized rationale connecting this event to user interests" }
            },
            required: ["name", "date", "description", "location", "llmReasoning"]
          }
        }
      }
    });

    const resultText = response.text?.trim() || "[]";
    const parsed = JSON.parse(resultText);
    setInCache(cacheKey, { events: parsed });
    return res.json({ events: parsed, cached: false });
  } catch (error: any) {
    return handleRouteError(res, error, "Events error");
  }
});

// 5. Authentic Connections & Experiences Endpoint
app.post("/api/connections", async (req, res) => {
  const cacheKey = getCacheKey("/api/connections", req.body);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const { destination } = req.body;
    if (!destination) {
      return res.status(400).json({ error: "Destination is required" });
    }

    const ai = getGemini();

    const prompt = `Search the web for real, specific local experience providers, craft workshops, artisanal guilds, cooking schools, guided historical walks, or home-stay hosts in or around "${destination}".
Identify real businesses or groups offering authentic local engagement.
For each provider:
- "provider": Name of the artisan, guild, school, or host.
- "type": The category (e.g. Ceramics Guild, Pottery Workshop, Culinary School, Historical walking association).
- "description": Vivid overview of what the visitor does with them.
- "outreachDraft": A personalized, warm introduction outreach message drafted on behalf of the traveler, showing genuine interest in their craft/heritage and asking about availability.
- "recommendedQuestions": An array of 3 thoughtful, heritage-conscious questions the traveler can ask before booking to establish rapport.

Return a strict JSON response conforming to the schema.`;

    const response = await robustGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              provider: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              outreachDraft: { type: Type.STRING },
              recommendedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["provider", "type", "description", "outreachDraft", "recommendedQuestions"]
          }
        }
      }
    });

    const resultText = response.text?.trim() || "[]";
    const parsed = JSON.parse(resultText);
    setInCache(cacheKey, { connections: parsed });
    return res.json({ connections: parsed, cached: false });
  } catch (error: any) {
    return handleRouteError(res, error, "Connections error");
  }
});

// 6. Immersive Storytelling Follow-Up (Conversational Chat / Narrative)
app.post("/api/story", async (req, res) => {
  try {
    const { destination, targetPlace = "", mode = "local", history = [] } = req.body;
    if (!destination) {
      return res.status(400).json({ error: "Destination is required" });
    }

    const ai = getGemini();

    const personaPrompts: Record<string, string> = {
      historian: "You are an scholarly, engaging historian. Focus on chronological periods, architecture, key figures, and verified political or social evolutions.",
      local: "You are a warm, proud local resident speaking to an honored guest. Focus on personal/neighborhood perspective, sensory vibes, sounds, smells, and unwritten customs.",
      poetic: "You are an eloquent, sensory-focused poetic travel writer. Write with beautiful prose, painting vivid, detailed mental canvases of the air, shadows, sea, and light.",
      kids: "You are an enthusiastic, friendly storyteller for families with kids. Focus on exciting adventures, funny secrets, cool legends, and interactive trivia.",
    };

    const activePersona = personaPrompts[mode] || personaPrompts.local;

    // We build the conversation contents
    const messages = [];
    
    // Add context to first message
    const initialInstruction = `[Context: We are exploring the cultural heritage of "${destination}" ${
      targetPlace ? `specifically looking at "${targetPlace}"` : ""
    }. Mode: ${mode.toUpperCase()}].
${activePersona}
Write an on-demand, highly engaging, sensory narrative of the history, folklore, local legends, and unique scene-setting details of this location. Ensure factual accuracy using Google Search grounding. Cite your findings and avoid fabrication. Keep the tone immersive and captivating. Try to format with markdown (headings, bold, lists).`;

    if (history.length === 0) {
      messages.push({ role: "user", parts: [{ text: initialInstruction }] });
    } else {
      // Map historical messages to standard parts representation
      // Inject system context as instruction helper
      messages.push({ role: "user", parts: [{ text: `System Instruction: Always follow this persona: ${activePersona}` }] });
      for (const msg of history) {
        messages.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }

    const response = await robustGenerateContent({
      model: "gemini-3.5-flash",
      contents: messages,
      config: {
        tools: [{ googleSearch: {} }],
        // Free text storytelling with Markdown layout
      }
    });

    const storyText = response.text || "";
    
    // Extract search citations
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const citations = chunks
      ? chunks
          .map((c: any) => ({
            title: c.web?.title || "Web Resource",
            url: c.web?.uri || "",
          }))
          .filter((c: any) => c.url)
      : [];

    // De-duplicate citations by URL
    const uniqueCitations = Array.from(new Map(citations.map((item: any) => [item.url, item])).values());

    return res.json({ story: storyText, citations: uniqueCitations });
  } catch (error: any) {
    return handleRouteError(res, error, "Storytelling error");
  }
});

// 7. Dynamic Trip Assembly / Itinerary sequencing
app.post("/api/itinerary", async (req, res) => {
  const cacheKey = getCacheKey("/api/itinerary", req.body);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const { destination, selections, dates = "3 Days", travelPace = "balanced" } = req.body;
    if (!destination) {
      return res.status(400).json({ error: "Destination is required" });
    }
    if (!selections || selections.length === 0) {
      return res.status(400).json({ error: "At least one selection is required to build an itinerary" });
    }

    const ai = getGemini();

    const prompt = `Assemble an optimized day-by-day travel itinerary for "${destination}" across "${dates}".
The traveler has selected the following authentic items to include:
${JSON.stringify(selections, null, 2)}

Travel Pace requested: "${travelPace}" (e.g. relaxed, balanced, packed).

Your goal is to arrange these selections logically by:
1. Geography and physical proximity.
2. Best times of day (e.g. viewpoints at sunset, outdoor walks in morning, dinners at local specialties).
3. Logical daily flows (insert appropriate local meals, transits, and resting phases matching the pace).
4. Providing real, dynamic "routingInsight" for each transit/activity (e.g., "Walk 10 mins east," "Take the historic Tram 28," "Best accessed by taxi due to hills").

Structure the output strictly as a JSON object matching the itinerary schema, including a beautiful title, summary rationale, and day-by-day schedules. Ensure all selected items are honored.`;

    const response = await robustGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "An evocative, curated title for the personalized itinerary" },
            summary: { type: Type.STRING, description: "A high-level reasoning summary of how the days were structured and optimized" },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  theme: { type: Type.STRING, description: "Daily focus or vibe, e.g. 'Old Town Heritage & Sunset Views'" },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeSlot: { type: Type.STRING, description: "Suggested time slot, e.g., '09:00 AM - 11:30 AM'" },
                        title: { type: Type.STRING, description: "Activity title matching user selections or added meals/breaks" },
                        type: { type: Type.STRING, description: "One of: attraction, event, connection, meal, transit" },
                        description: { type: Type.STRING, description: "Evocative summary of what to experience and look for" },
                        routingInsight: { type: Type.STRING, description: "Dynamic practical geographical/transportation tips" }
                      },
                      required: ["timeSlot", "title", "type", "description"]
                    }
                  },
                  dailyInsight: { type: Type.STRING, description: "An expert tip for this specific day (e.g. booking ahead, weather advice)" }
                },
                required: ["dayNumber", "theme", "activities", "dailyInsight"]
              }
            }
          },
          required: ["title", "summary", "days"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    setInCache(cacheKey, { itinerary: parsed });
    return res.json({ itinerary: parsed, cached: false });
  } catch (error: any) {
    return handleRouteError(res, error, "Itinerary error");
  }
});


// Dynamic Image Generation for Destinations / Hero Banners
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGemini();
    console.log(`[Image Generation] Creating image for prompt: "${prompt}"`);

    // Use gemini-3.1-flash-lite-image by default as per guidelines
    const response = await robustGenerateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            text: `A beautifully framed high-resolution cinematic travel photograph of ${prompt}. Masterfully captured with professional lighting, depth of field, vibrant cultural colors, and authentic local atmosphere. No text, no frames.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        return res.json({ imageUrl: `data:image/png;base64,${base64Data}` });
      }
    }

    throw new Error("No image data returned from model");
  } catch (error: any) {
    return handleRouteError(res, error, "Image generation error");
  }
});


// Mount Vite Middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Destination Discovery server running on port ${PORT}`);
  });
}

startServer();
