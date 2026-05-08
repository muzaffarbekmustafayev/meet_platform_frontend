# Meetra — Frontend

The web client for Meetra. React 19, Vite 6, Tailwind CSS 4. Designed to feel like Zoom: dark room, clean dock, fast call setup.

## ✨ Features

- **HD WebRTC video** — mesh topology via `simple-peer`
- **Voice-isolated audio** — `echoCancellation`, `noiseSuppression`, `autoGainControl`, mono channel — no echo when multiple people speak
- **Push-to-talk** — hold the mic button to talk while muted
- **Screen sharing** — single-click flow, browser handles source + audio toggle
- **Chat panel** — file attachments, edit/delete, message grouping, read receipts
- **Participants panel** — search, role badges (Host / Co-host / Participant / Guest), per-user moderation
- **Host controls** — mute everyone, end meeting for all, kick, block, promote co-host
- **Hand raise**, **recording** (host-only), **meeting timer**
- **Spotlight & pin**, **speaker / grid view** with auto-layout
- **Dashboard** — recent meetings, schedule, profile, history with new-meeting shortcut
- **Light / dark mode**, **uz / ru / en** with live switch
- **PWA-ready** — responsive, safe-area aware, mobile gestures

## 🛠 Stack

- [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/) (no PostCSS config — uses native v4 engine)
- [React Router 7](https://reactrouter.com/) — SPA routing
- [simple-peer](https://github.com/feross/simple-peer) — WebRTC
- [socket.io-client](https://socket.io/) — signaling + chat
- [lucide-react](https://lucide.dev/) — icons
- [axios](https://axios-http.com/) — HTTP

## 📁 Structure

```text
src/
├── components/
│   ├── ChatPanel.jsx           # In-meeting chat
│   ├── Video.jsx               # Per-participant video tile
│   ├── room/
│   │   ├── RoomBottomControls.jsx   # Dock (mic, cam, share, leave...)
│   │   └── RoomScreens.jsx          # Waiting / denied screens
│   ├── LanguageToggle.jsx
│   ├── ThemeToggle.jsx
│   ├── ConfirmModal.jsx
│   └── Select.jsx
├── context/
│   ├── AuthContext.jsx         # JWT login state
│   ├── ThemeLanguageContext.jsx # i18n + dark/light
│   └── ToastContext.jsx
├── pages/
│   ├── AuthPage.jsx            # Login + register
│   ├── Dashboard.jsx           # Home, Join, Schedule, Profile, History
│   ├── RoomPage.jsx            # Live meeting
│   └── AdminPage.jsx           # Admin console
├── api.js                      # Axios instance + interceptors
├── App.jsx                     # Routes
└── main.jsx                    # Entry
```

## ⚙️ Setup

```bash
# Requires Node.js 18+
npm install
cp .env.example .env
```

**`.env`**

```env
VITE_BACKEND_URL=http://localhost:5005
VITE_APP_NAME=Meetra
```

## 🧑‍💻 Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Vite dev server on `:5173`            |
| `npm run build`   | Production build → `dist/`            |
| `npm run preview` | Serve the built `dist/` locally       |
| `npm run lint`    | ESLint                                |

## 🏗 Build pipeline

`vite.config.js` is tuned for production:

- Pre-bundles `simple-peer`, `socket.io-client`, `buffer`
- `define: { global: 'globalThis' }` so peer libs resolve `global` at build time
- Manual chunks split: `react-vendor`, `webrtc`, `icons`, app code → better edge cache hits
- Targets `es2020`

## 🚀 Deploy to Vercel

1. Import the repo in Vercel.
2. **Root Directory** = `meet_platform_frontend`.
3. Framework Preset = **Vite** (auto).
4. Env var: `VITE_BACKEND_URL=https://your-backend.example.com`.
5. The included [`vercel.json`](./vercel.json) rewrites all paths to `index.html` so React Router's deep links survive a hard refresh.
6. If you see a 403 on the deployment, disable **Deployment Protection** in **Project → Settings**.

## 📄 License

MIT
