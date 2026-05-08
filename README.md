# Meetra Platform - Frontend

The sleek, responsive, and feature-rich user interface for Meetra, a modern video conferencing platform. Built with React 19, Vite, and Tailwind CSS for a lightning-fast user experience.

## 🌟 Key Features

- **Modern UI/UX**: Clean, intuitive interface with Dark/Light mode support.
- **Real-time Video/Audio**: High-quality WebRTC implementation using `simple-peer`.
- **Dynamic Roles**: Special controls for Hosts, Co-hosts, and Participants.
- **Waiting Room**: A polished pre-join experience with host approval logic.
- **Interactive Chat**: Real-time messaging with participant status updates.
- **Screen Sharing**: Advanced screen sharing with audio mixing capabilities.
- **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile devices.
- **Multilingual**: Built-in support for multiple languages (Uzbek, English, Russian).

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
- **WebRTC**: [Simple-peer](https://github.com/feross/simple-peer)
- **Real-time**: [Socket.io-client](https://socket.io/docs/v4/client-api/)
- **Routing**: [React Router 7](https://reactrouter.com/)

## 📁 Project Structure

```text
meet_platform_frontend/
├── src/
│   ├── components/     # Reusable UI components (Modals, Toggles, Video)
│   ├── context/        # React Context API (Auth, Theme, Toast)
│   ├── pages/          # Main application views (Dashboard, Room, Auth)
│   ├── api.js          # Axios configuration and interceptors
│   ├── App.jsx         # Main application entry and routing
│   └── main.jsx        # React DOM rendering
├── public/             # Static assets
└── vercel.json         # Vercel deployment configuration
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Navigate to the frontend folder:
   ```bash
   cd meet_platform_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```env
   VITE_BACKEND_URL=http://localhost:5005
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## 🚀 Deployment

The project is optimized for [Vercel](https://vercel.com/).

1. Connect your repository to Vercel.
2. Set the **Root Directory** to `meet_platform_frontend`.
3. Add `VITE_BACKEND_URL` to the Environment Variables.
4. Deploy!

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
