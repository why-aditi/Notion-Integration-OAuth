# Notion Integration

A full-stack application that integrates with Notion API to manage and synchronize data between your application and Notion workspaces.

## Features

- Connect to Notion workspaces using OAuth
- Manage database connections
- Synchronize data between your application and Notion
- User authentication and authorization
- Workspace management

## Project Structure

```
Notion Integration/
├── backend/                 # Backend server (Node.js/Express)
│   ├── migrations/          # Database migrations
│   ├── scripts/             # Utility scripts
│   ├── src/                 # Source code
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   └── middleware/      # Express middleware
│   ├── .env                # Environment variables
│   ├── .env.example        # Environment variables template
│   └── server.js           # Main server file
│
└── frontend/               # Frontend application (React)
    ├── public/             # Static files
    └── src/                # Source code
        ├── assets/         # Static assets
        ├── components/     # Reusable components
        └── pages/          # Page components
```

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Notion API credentials
- PostgreSQL database

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update the environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database connection details and Notion API credentials.

5. Run database migrations:
   ```bash
   npm run migrate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update the environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend

```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/notion_integration
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=http://localhost:3000/auth/notion/callback
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Frontend

```
VITE_API_BASE_URL=http://localhost:3001
VITE_NOTION_CLIENT_ID=your_notion_client_id
VITE_NOTION_REDIRECT_URI=http://localhost:3000/auth/notion/callback
```

## Available Scripts

### Backend

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm run migrate` - Run database migrations
- `npm test` - Run tests

### Frontend

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests

## API Documentation

API documentation is available at `http://localhost:3001/api-docs` when the backend server is running.

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
