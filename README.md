# GastroChef

- React + Vite frontend (`GastroChef`)
- Node.js + Express + Socket.IO backend (`server`)
- MongoDB database

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- MongoDB (I used local MongoDB Compass)

## Installation

```bash
git clone <repo-url>
cd GastroChef
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../GastroChef
npm install
```

## Environment setup

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/GastroChef
JWT_SECRET=secret_jwt_key
```

## Run the project

Start backend:

```bash
cd server
npm run dev
```

Start frontend:

```bash
cd GastroChef
npm run dev
```

Frontend URL: `http://localhost:5173`  
Backend URL: `http://localhost:5000`

## Seed database

```bash
cd server
node seed.js
```

## Project Architecture

```
GastroChef
 ┣ GastroChef
 ┃ ┣ public
 ┃ ┃ ┗ vite.svg
 ┃ ┣ src
 ┃ ┃ ┣ assets
 ┃ ┃ ┃ ┗ react.svg
 ┃ ┃ ┣ pages
 ┃ ┃ ┃ ┣ Login.jsx
 ┃ ┃ ┃ ┣ Register.jsx
 ┃ ┃ ┃ ┗ Dashboard.jsx
 ┃ ┃ ┣ components
 ┃ ┃ ┃ ┣ Laboratory.jsx
 ┃ ┃ ┃ ┣ Marketplace.jsx
 ┃ ┃ ┃ ┣ ServicePanel.jsx
 ┃ ┃ ┃ ┣ Stock.jsx
 ┃ ┃ ┃ ┣ Navbar.jsx
 ┃ ┃ ┃ ┣ ProtectedRoute.jsx
 ┃ ┃ ┃ ┣ RecipeBook.jsx
 ┃ ┃ ┃ ┗ FinancialDashboard.jsx
 ┃ ┃ ┣ context
 ┃ ┃ ┃ ┣ AuthContext.jsx
 ┃ ┃ ┃ ┗ GameContext.jsx
 ┃ ┃ ┣ services
 ┃ ┃ ┃ ┣ api.js
 ┃ ┃ ┃ ┗ socket.js
 ┃ ┃ ┣ api
 ┃ ┃ ┃ ┗ ingredients.api.js
 ┃ ┃ ┣ App.jsx
 ┃ ┃ ┣ index.css
 ┃ ┃ ┗ main.jsx
 ┃ ┣ .gitignore
 ┃ ┣ package-lock.json
 ┃ ┣ package.json
 ┃ ┣ vite.config.js
 ┃ ┣ eslint.config.js
 ┃ ┗ index.html
 ┣ server
 ┃ ┣ models
 ┃ ┃ ┣ User.js
 ┃ ┃ ┣ Save.js
 ┃ ┃ ┣ Ingredient.js
 ┃ ┃ ┣ Recipe.js
 ┃ ┃ ┗ Transaction.js
 ┃ ┣ config
 ┃ ┃ ┗ db.js
 ┃ ┣ routes
 ┃ ┃ ┣ auth.routes.js
 ┃ ┃ ┣ economy.routes.js
 ┃ ┃ ┣ ingredient.routes.js
 ┃ ┃ ┣ lab.routes.js
 ┃ ┃ ┗ save.routes.js
 ┃ ┣ middleware
 ┃ ┃ ┗ auth.middleware.js
 ┃ ┣ algo
 ┃ ┃ ┗ recipeMatcher.js
 ┃ ┣ socket
 ┃ ┃ ┗ game.socket.js
 ┃ ┣ db
 ┃ ┃ ┣ seed.js
 ┃ ┃ ┗ cheat.js
 ┃ ┣ package.json
 ┃ ┣ package-lock.json
 ┃ ┣ .env
 ┃ ┣ cheat.js
 ┃ ┣ server.js
 ┃ ┗ seed.js
 ┗ README.md
```

## Main flows

1. Authentication with JWT (`/api/auth/register`, `/api/auth/login`)
2. Real-time order flow through Socket.IO (`newOrder`, `serveOrder`, `orderFailed`)
3. Economy endpoints (`/api/economy/overview`, `/api/economy/buy`)
4. Lab experiments (`/api/lab/experiment`)

## Rules

- Initial satisfaction: `20`
- Game over when satisfaction `< 0`
- Game over when treasury `< 0`
- Game over reset clears progress (recipes, inventory, treasury, satisfaction)

## Work delivered

- Register / Login page
- Real-time service gameplay loop
- Economy and transaction tracking
- Financial dashboard UI
- Per-user socket session cleanup
- Improved marketplace, stock, laboratory, and service UX
- Navbar dropdown logout and redirect to login page