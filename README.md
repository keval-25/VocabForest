# 🌿 VocabForest — iPhone Glass UI Vocabulary Web Application

An ultra-modern, motion-infused vocabulary builder web application featuring **iPhone Liquid Glassmorphism (Glass UI)**, dynamic iOS Island/Dock controls, ambient generative Haikei vector mesh background, and full CRUD operations persisted to a local JSON database on the server, fully prepared for deployment on Vercel.

---

## ✨ Features & Design Highlights

1. **iPhone Liquid Glassmorphism (Glass UI)**:
   - High-contrast frosted glass panels with `backdrop-filter: blur(28px) saturate(190%)`.
   - Specular border reflections (`border: 1px solid rgba(255, 255, 255, 0.12)`) and inner highlights.
   - 3D magnetic card tilt physics that tracks mouse coordinates with perspective rotation.

2. **Dual Modal Triggers**:
   - **Top-Right Button**: Glass button with glowing shimmer sweep.
   - **Bottom-Middle Floating Action Dock**: iOS Dynamic Island style dock with center primary `+ Add Word` button.
   - Keyboard shortcut `N` to open modal from anywhere.

3. **Card Click-to-Edit & Full CRUD**:
   - **Create**: Add word, phonetic, part of speech, definition, examples, tags, and difficulty.
   - **Read**: Live search filter (`Press /`), tag filters, part of speech pills, and sorting.
   - **Update**: Click on any card to edit words, meanings, examples, or mastery state in real time.
   - **Delete**: Instant word deletion with confirmation.

4. **Speech Synthesis Pronunciation**:
   - Siri-like voice pronunciation on each card using Web SpeechSynthesis API.

5. **Realtime Colors Theme Engine**:
   - **Manus Midnight** (iOS Obsidian + Sapphire & Lavender)
   - **Quartz Light** (Frosted crystal light mode)
   - **Emerald Aurora** (Dark Forest Mint & Cyan)
   - **Cyberpunk Neon** (Vibrant Magenta & Cyan)
   - **Sunset Ember** (Warm Terracotta & Golden Glow)
   - Persisted across reloads in `localStorage`.

6. **Local JSON Database Storage**:
   - Data stored in `data/words.json` and committed to the server's local path.
   - Serverless fallback safety layer for cloud platforms like Vercel.

---

## 🚀 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open in browser
# Visit http://localhost:3000
```

---

## 🌐 Steps to Deploy on Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   # Create a new repository on GitHub (e.g., VocabForest)
   git remote add origin https://github.com/<your-username>/VocabForest.git
   git branch -M main
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **Add New...** -> **Project**.
   - Select your **VocabForest** repository from GitHub.
   - Framework Preset will automatically detect **Next.js**.
   - Click **Deploy**.

3. **Live in ~60 seconds**:
   - Vercel will build and assign you a live production URL (e.g., `https://vocab-forest.vercel.app`).

---

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy directly from the terminal**:
   ```bash
   vercel
   ```
   - Follow the prompts (link project, accept defaults).
   - For production deployment:
   ```bash
   vercel --prod
   ```

---

### 💡 Note on Serverless Persistence on Vercel

In local development and traditional servers, updates are written directly to `data/words.json`.
When deployed to Vercel serverless environments:
- The base filesystem is read-only at runtime (with temporary write access in `/tmp`).
- VocabForest includes an automatic fallback cache that keeps reads and writes operating smoothly.
- For permanent cloud-wide persistence across serverless cold starts, you can easily connect [Vercel KV](https://vercel.com/docs/storage/vercel-kv), [Vercel Blob](https://vercel.com/docs/storage/vercel-blob), or Supabase in just a few lines.
