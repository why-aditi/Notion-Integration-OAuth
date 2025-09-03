# Notion Integration Frontend

This is a React-based frontend for the Notion Integration service. It allows users to connect their Notion workspaces and manage their integrations.

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Backend server running (see backend README for setup)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file and update the values:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your backend API URL and other configuration.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Environment Variables

- `VITE_API_BASE_URL`: The base URL of your backend API (default: `http://localhost:3000/api/notion`)
- `VITE_APP_NAME`: The name of your application (default: `Notion Integration`)
- `VITE_APP_ENV`: The current environment (e.g., `development`, `production`)

## Features

- Connect multiple Notion workspaces
- View connected workspaces
- Disconnect workspaces
- Error handling and success messages
- Responsive design

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
