
# Mini Project Manager

A full-stack Project & Task Management web application built with **Next.js**, **React**, **Redux Toolkit**, **Node.js**, **Express**, and **MongoDB**. Users can register and authenticate via JWT, manage personal projects with live completion progress, and organize project tasks with server-side status filtering, due-date sorting, and overdue tracking.

---

## Tech Stack

* **Frontend:** React, Next.js (App Router, TypeScript), Tailwind CSS, Lucide Icons
* **State Management:** Redux Toolkit (`createSlice`, `createAsyncThunk`), React-Redux
* **HTTP Client:** Axios (with request/response JWT & `401` interceptors)
* **Backend:** Node.js, Express.js, Mongoose ODM
* **Database:** MongoDB (Local or MongoDB Atlas)
* **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing, IDOR ownership guards

---

## Project Structure

```text
mini-project-manager/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # MongoDB connection setup
│   │   ├── controllers/      # Auth, Project, and Task route handlers
│   │   ├── middleware/       # JWT verification middleware
│   │   ├── models/           # Mongoose schemas (User, Project, Task)
│   │   ├── routes/           # Express API routers
│   │   └── server.js         # Express entry point
│   ├── .env.example          # Sample backend environment variables
│   └── package.json
├── frontend/                 # Next.js + Redux Toolkit client
│   ├── src/
│   │   ├── app/              # App Router pages (/login, /register, /dashboard, /projects/[id])
│   │   ├── components/       # Navbar, ProtectedRoute, DatePicker, StatusSelect
│   │   ├── lib/              # Axios instance with JWT interceptor
│   │   └── store/            # Redux store, typed hooks, and async slices
│   ├── .env.example          # Sample frontend environment variables
│   └── package.json
└── README.md

```

---

## Prerequisites

* **Node.js** v18+ (tested on Node.js v20 / v24)
* **npm** v9+
* **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a **MongoDB Atlas** connection string

---

## Getting Started (Local Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/Vedantroy475/Web-Plant-Mini-Project-Manager.git
cd mini-project-manager

```

### 2. Generate a Secure `JWT_SECRET`

Run the following one-line Node.js command in your terminal to generate a cryptographically strong 64-byte hex secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

```

Copy the output string—you will paste it as `JWT_SECRET` in `backend/.env` in the next step.

### 3. Backend Setup & Run

```bash
cd backend
npm install

```

Create your environment file from the sample template:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

```

Open `backend/.env` and configure your values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mini-project-manager
JWT_SECRET=<paste_your_generated_hex_secret_here>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

```

Start the Express development server:

```bash
npm run dev

```

The backend API will run on `http://localhost:5000` (health check available at `GET http://localhost:5000/api/health`).

### 4. Frontend Setup & Run

Open a second terminal window, navigate to `frontend/`, and install dependencies:

```bash
cd frontend
npm install

```

Create your local environment file from the sample template:

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local

```

Ensure `frontend/.env.local` contains:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

```

Start the Next.js development server:

```bash
npm run dev

```

Open **`http://localhost:3000`** in your browser.

---

## API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public | Register a new user and return JWT + profile |
| `POST` | `/api/auth/login` | Public | Authenticate user and return JWT + profile |
| `GET` | `/api/auth/me` | Protected | Hydrate currently authenticated user profile |

### Projects *(Requires `Authorization: Bearer <token>`)*

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/projects` | Protected | List all projects owned by the user (with task counts) |
| `POST` | `/api/projects` | Protected | Create a new project |
| `PUT` | `/api/projects/:id` | Protected | Update title/description of an owned project |
| `DELETE` | `/api/projects/:id` | Protected | Delete an owned project and cascade-delete its tasks |

### Tasks *(Requires `Authorization: Bearer <token>`)*

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/projects/:projectId/tasks` | Protected | List project tasks (supports `?status=`, `?sortBy=dueDate`, `?order=asc|desc`) |
| `POST` | `/api/projects/:projectId/tasks` | Protected | Create a task inside an owned project |
| `PUT` | `/api/tasks/:id` | Protected | Update a task's title, description, status, or due date |
| `DELETE` | `/api/tasks/:id` | Protected | Delete a task |

---

## Implementation Notes

* **Ownership & IDOR Protection:** Every project and task endpoint validates `ObjectId` format and verifies that `project.owner` matches `req.userId` before reading, mutating, or deleting data (returning `403 Forbidden` on unauthorized access).
* **Cascading Deletes & Aggregation:** Deleting a project triggers a Mongoose `pre('deleteOne')` document hook to remove orphaned tasks. `GET /api/projects` uses a MongoDB aggregation pipeline (`$group`) to compute `totalTasks` and `completedTasks` per project in a single query.
* **Server-Side Filtering & Sorting:** Task status filters (`todo`, `in-progress`, `done`) and due-date sorting (`asc` / `desc`) are executed directly in MongoDB using a compound index `{ project: 1, status: 1, dueDate: 1 }`.
* **Session Hydration & Route Guards:** On browser refresh, `ReduxProvider` dispatches `loadUser` (`GET /api/auth/me`) to restore auth state before `<ProtectedRoute>` renders protected views. An Axios response interceptor automatically clears stale tokens and redirects to `/login` on `401 Unauthorized` responses.
* **Custom Accessible UI Controls:** Built modular, dependency-free `DatePicker` and `StatusSelect` components with keyboard (`Escape`) and outside-click dismissal, plus automatic red overdue highlighting (`dueDate < now && status !== 'done'`).


