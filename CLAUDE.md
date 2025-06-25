# CLAUDE.md
全て日本語で回答すること．

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Discord clone built for learning purposes using modern web technologies. The project features real-time messaging with WebSocket connections, a React frontend, and a TypeScript backend.

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling with Discord-inspired design system
- **WebSocket** for real-time messaging
- **Heroicons** for icons

### Backend
- **TypeScript** with **Hono** framework
- **WebSocket Server** for real-time communication
- **PostgreSQL** for data persistence
- **Node.js** runtime

### Infrastructure
- **Docker Compose** for PostgreSQL database
- **Monorepo** structure with separate frontend/backend

## Project Structure

```
├── frontend/          # React + TypeScript + Tailwind
├── backend/           # Node.js + Hono + TypeScript
├── docker-compose.yml # PostgreSQL container
└── package.json       # Root workspace configuration
```

## Development Commands

### Initial Setup
```bash
# Install dependencies for both frontend and backend
npm install
cd frontend && npm install
cd ../backend && npm install

# Start PostgreSQL database
npm run docker:up

# Copy environment variables
cp backend/.env.example backend/.env
```

### Development
```bash
# Start both frontend and backend in development mode
npm run dev

# Or run individually:
npm run dev:frontend  # Starts React dev server on port 5173
npm run dev:backend   # Starts Hono server on port 3001
```

### Database
```bash
# Start PostgreSQL container
npm run docker:up

# Stop PostgreSQL container
npm run docker:down
```

### Build
```bash
# Build both frontend and backend
npm run build

# Or build individually:
npm run build:frontend
npm run build:backend
```

## Database Schema

The PostgreSQL database includes these main tables:
- `users` - User accounts and profiles
- `servers` - Discord-like servers/guilds
- `channels` - Text channels within servers
- `messages` - Chat messages
- `server_members` - User membership in servers

## API Endpoints

### HTTP API
- `GET /health` - Health check
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

### WebSocket
- Connection endpoint: `ws://localhost:3001`
- Real-time message broadcasting
- Connection status management

## Development Environment

- **SpecStory**: AI chat history preservation (`.specstory/`)
- **Claude Code**: Local permissions configured (`.claude/settings.local.json`)
- **Cursor**: SpecStory files excluded from indexing

## Common Issues

- Ensure PostgreSQL is running via Docker before starting the backend
- Frontend connects to WebSocket on `ws://localhost:3001`
- Backend API runs on `http://localhost:3001`
- Frontend dev server runs on `http://localhost:5173`