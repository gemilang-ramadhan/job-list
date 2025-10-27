# Jobby - Job Management Platform

## Project Overview

**Jobby** is a job management platform simulation that enables seamless job posting and application workflows. The application supports two distinct user experiences:

### Admin Dashboard

- Create, manage, and publish job openings
- Configure application form requirements
- View and manage candidate applications
- Track job status (draft/active)
- Manage candidate data with resizable table views

### User Dashboard

- Browse active job openings
- View detailed job descriptions
- Submit job applications with comprehensive profile information
- Responsive mobile and desktop experiences

All data persists in browser `localStorage` with no backend dependency, making it a fully client-side application with role-based routing and session management.

## Tech Stack Used

### Frontend

- **React 19** - Modern UI library with latest features
- **TypeScript 5.9** - Type-safe development
- **React Router v7** - Client-side routing with role-based access
- **Tailwind CSS** - Utility-first styling framework
- **Vite** - Fast build tool and dev server
- **FontAwesome** - Icon library for UI elements

### Testing

- **User Event** - Manual user interaction simulation

### Build & Development Tools

- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing
- **TypeScript ESLint** - TypeScript-specific linting rules

### State Management

- Browser `localStorage` - Persistent data storage
- React hooks (`useState`, `useEffect`) - Component state
- Custom events - Cross-component communication

## How to Run Locally

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd job-list
   ```

2. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:5173`

### Login Credentials

The application uses role-based authentication with two pre-configured accounts:

**Admin Account:**

- Email: `admin@gmail.com`
- Password: `admin`

**User Account:**

- Email: `user@gmail.com`
- Password: `user`

### Development Notes

- All data is stored in browser `localStorage` - no backend required
- Session persists across page reloads using the `jobby-session-role` localStorage key
- The application supports magic link (email-only) and password-based login flows
- Job IDs follow the format: `job_YYYYMMDD_xxxx`
- Candidate IDs follow the format: `cand_YYYYMMDD_xxxx`

### Troubleshooting

**Port already in use:**

- Vite will automatically try the next available port
- Or manually specify: `npm run dev -- --port 3000`

**localStorage cleared:**

- All jobs and candidates will be reset
- Re-login with credentials above
