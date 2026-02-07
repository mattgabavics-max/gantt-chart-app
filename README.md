# Gantt Chart Application

A full-stack Gantt chart application built with React, TypeScript, Express, and PostgreSQL.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM for database management
- **PostgreSQL** - Database

### Monorepo Structure
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript types and interfaces

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd gantt-chart
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for all workspaces (client, server, and shared).

### 3. Set up environment variables

#### Server Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cp server/.env.example server/.env
```

Update the `.env` file with your database credentials:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/gantt_chart_db?schema=public"
CLIENT_URL=http://localhost:3000
```

#### Client Environment Variables

Create a `.env` file in the `client/` directory:

```bash
cp client/.env.example client/.env
```

The default values should work for local development.

### 4. Set up the database

Create a PostgreSQL database:

```bash
createdb gantt_chart_db
```

Or using psql:

```sql
CREATE DATABASE gantt_chart_db;
```

### 5. Run Prisma migrations

```bash
npm run prisma:migrate
```

This will create the database tables based on the Prisma schema.

### 6. Generate Prisma Client

```bash
npm run prisma:generate
```

### 7. Start the development servers

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Available Scripts

### Root Level

- `npm run dev` - Run both client and server in development mode
- `npm run dev:client` - Run only the frontend
- `npm run dev:server` - Run only the backend
- `npm run build` - Build both client and server
- `npm run prisma:migrate` - Run Prisma migrations
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio

### Client

- `npm run dev --workspace=client` - Start Vite dev server
- `npm run build --workspace=client` - Build for production
- `npm run preview --workspace=client` - Preview production build

### Server

- `npm run dev --workspace=server` - Start development server with hot reload
- `npm run build --workspace=server` - Build TypeScript to JavaScript
- `npm run start --workspace=server` - Run production server

## Project Structure

```
gantt-chart/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── main.tsx       # Application entry point
│   │   └── index.css      # Global styles with Tailwind
│   ├── index.html         # HTML template
│   ├── vite.config.ts     # Vite configuration
│   ├── tailwind.config.js # Tailwind configuration
│   └── package.json
│
├── server/                 # Express backend
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Server entry point
│   └── package.json
│
├── shared/                 # Shared TypeScript types
│   ├── src/
│   │   ├── types.ts       # Shared type definitions
│   │   └── index.ts       # Exports
│   └── package.json
│
├── .gitignore
├── package.json           # Root package with workspaces
└── README.md
```

## Database Schema

The application uses the following main entities:

- **Project** - Represents a project containing multiple tasks
  - id, name, description, startDate, endDate, timestamps

- **Task** - Represents individual tasks within a project
  - id, name, description, startDate, endDate, progress, status, priority
  - Supports parent-child relationships for task dependencies

## API Endpoints

### Health Check
- `GET /api/health` - Check if the server is running

### Projects (to be implemented)
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks (to be implemented)
- `GET /api/projects/:projectId/tasks` - Get all tasks for a project
- `POST /api/projects/:projectId/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Development

### Adding New Features

1. Define shared types in `shared/src/types.ts`
2. Update Prisma schema if needed (`server/prisma/schema.prisma`)
3. Create API routes in `server/src/routes/`
4. Create React components in `client/src/`

### Database Changes

After modifying the Prisma schema:

```bash
# Create a new migration
npm run prisma:migrate

# Regenerate Prisma Client
npm run prisma:generate
```

### Prisma Studio

To view and edit your database with a GUI:

```bash
npm run prisma:studio
```

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use, you can change them:
- Frontend: Update `VITE_PORT` in `client/.env`
- Backend: Update `PORT` in `server/.env`

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify database credentials in `server/.env`
- Check that the database exists

### Module Resolution Issues

If you encounter import errors:
- Run `npm install` in the root directory
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
