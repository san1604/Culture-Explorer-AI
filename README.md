# GenAI-Powered Destination Discovery & Cultural Experience Platform

A dynamic, full-stack travel platform designed to uncover the soul of any destination. The app uses live Google Search Grounding to generate cultural primers, verify attractions, detect upcoming happenings, discover regional artisans, tell historical stories, and assemble custom optimized itineraries in real time.

---

## 🏗️ Architecture Design Flow

```
                      +-----------------------------+
                      |        User Input           |
                      |  (Vague moods, destination, |
                      |    budget, season filters)  |
                      +--------------+--------------+
                                     |
                                     v
                      +--------------+--------------+
                      |     React Client Frontend   |
                      | (Tabbed Experience Explorer)|
                      +--------------+--------------+
                                     |
                                     | POST Request JSON
                                     v
                      +--------------+--------------+
                      |       Express Server        |
                      |  (Memory Cache Layer w/ TTL)|
                      +--------------+--------------+
                                     |
                         +-----------+-----------+
                         |                       |
                         v                       v
               +---------+---------+   +---------+---------+
               | Google Search Tool|   | Gemini-3.5-Flash  |
               | (Live Grounding   |   |   & Imagen APIs   |
               |  Factual Claims)  |   | (Creative Story,  |
               +-------------------+   |  Itinerary Flows) |
                                       +-------------------+
```

---

## 🛠️ Technology Stack Used

- **Frontend Core:** React 19, TypeScript, Tailwind CSS v4, Lucide icons.
- **Server Core:** Express (Node.js), `dotenv`, `tsx` for live ES module execution.
- **AI Core:** `@google/genai` (SDK version `2.4.0`) leveraging `gemini-3.5-flash` with active tool-calling, `googleSearch` grounding enabled on every endpoint, and `gemini-3.1-flash-lite-image` for high-resolution cinematic scenery creation.
- **Build Core:** Vite 6, `esbuild` for CJS-bundle packaging for server execution in production containers.

---

## 🛡️ "No Dummy Data" Policy & System Guardrails

We strictly enforce the master constraint: **0% hardcoded/pre-written mock data.** Every destination, sightseeing, local experience, outreach introduction, local phrase, and routing insight is fetched or generated live.

### 1. Verification-First Google Grounding
Every critical endpoint utilizes Google Search tool grounding:
- **UNESCO sites:** verified using query matches against current databases.
- **Local Events:** fetched dynamically to ensure they are taking place in correct dates (e.g., 2026 scheduling window).
- **Artisans & Workshops:** gathered from local craft registry mentions discovered on blogs and regional forums.

### 2. Live Session Caching Layer
To prevent redundant API/LLM execution rates and respect rate limit thresholds, an active **In-Memory Cache Layer with Time-To-Live (TTL)** is established on the server:
- Cache keys are generated dynamically based on JSON route bodies.
- Content retains active lifetime status for **10 Minutes**.
- After expiry, the server forces a live re-fetch to capture current updates.

### 3. Graceful Empty & Error States
If a destination returns no live events (due to offseason or highly quiet regions), we provide:
- Clear explanatory instructions on how to broaden filters.
- Re-query forms to edit date intervals or focus interests.
- Loading states featuring dynamic status logs (e.g., "Confirming coordinates...", "Grounding factual claims...").
