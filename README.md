# BuildCost

A MERN stack (MongoDB/PostgreSQL, Express, React, Node.js) web application for estimating construction and land development expenditures with deterministic baseline calculations and AI-assisted analysis.

## Monorepo Structure

```text
buildcost/
├── .env.example            # Environment variable template
├── README.md               # Setup and development guide
├── client/                 # React (Vite) frontend with Tailwind CSS
│   ├── src/
│   │   ├── App.jsx         # Health check UI & baseline app entry
│   │   ├── index.css       # Tailwind directives & styles
│   │   └── main.jsx
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   ├── vite.config.js      # Vite configuration (with /api proxy)
│   └── package.json
└── server/                 # Express backend
    ├── db/
    │   ├── pool.js         # Database connection pool
    │   ├── migrations/     # Database migration scripts
    │   └── seeds/          # Database seed scripts
    ├── server.js           # Express app & /api/health endpoint
    └── package.json
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- Database (MongoDB or PostgreSQL instance if using database operations)

---

### 2. Environment Setup

Copy `.env.example` to `.env` in the root directory (or create separate `.env` files in `/server` and `/client` as needed):

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
PORT=5000
DATABASE_URL=mongodb://localhost:27017/buildcost # Or postgresql://user:password@localhost:5432/buildcost
JWT_SECRET=your_jwt_secret_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

---

### 3. Installation

Install dependencies for both client and server:

#### Client
```bash
cd client
npm install
```

#### Server
```bash
cd ../server
npm install
```

---

### 4. Running the Development Servers

Run both servers locally in separate terminal windows:

#### Start the Server (Backend)
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5000` with the health check available at `http://localhost:5000/api/health`.

#### Start the Client (Frontend)
```bash
cd client
npm run dev
```
The Vite development server will run on `http://localhost:5173`. The client proxies `/api` requests to `http://localhost:5000`.

Open [http://localhost:5173](http://localhost:5173) in your browser to verify the connection and health check status.
