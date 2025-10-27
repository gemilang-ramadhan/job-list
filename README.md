# Jobby - Job Management Platform

## Project Overview

**Jobby** is a job management platform simulation that enables seamless job posting and application workflows. The application supports two distinct user experiences:

### Admin Dashboard

- Create, manage, and publish job openings
- Configure application form requirements
- View and manage candidate applications
- Track job status (draft/active)
- Manage candidate data with resizable table views
- Export candidate data to PDF or Excel (all candidates or selected)
- Search candidates by name
- Sort candidates by any column (ascending/descending)
- Filter candidates by gender
- Drag-and-drop column reordering
- Resizable table columns
- Pagination support (10 candidates per page)

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
- **jsPDF** - PDF generation for candidate exports
- **jsPDF-AutoTable** - Table formatting for PDF exports
- **SheetJS (xlsx)** - Excel file generation for candidate exports

### Testing

- **Vitest** - Fast unit test framework
- **Testing Library (React)** - React component testing utilities
- **User Event** - User interaction simulation
- **jsdom** - DOM environment for Node.js testing

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

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest

### Key Features

**Candidates Table:**

- **Search**: Real-time search by candidate name
- **Filter**: Filter candidates by gender (Male/Female)
- **Sort**: Sort by any column in ascending or descending order
- **Column Management**:
  - Drag-and-drop to reorder columns
  - Resize columns by dragging column separators
  - Min/max width constraints per column
- **Export**:
  - Export all candidates or selected candidates
  - PDF format with landscape orientation
  - Excel format (.xlsx)
  - Automatic filename generation with job title and date
- **Selection**:
  - Select individual candidates via checkboxes
  - Select all candidates with header checkbox
  - Indeterminate state support
- **Pagination**: 10 candidates per page with navigation controls

### Troubleshooting

**Port already in use:**

- Vite will automatically try the next available port
- Or manually specify: `npm run dev -- --port 3000`

**localStorage cleared:**

- All jobs and candidates will be reset
- Re-login with credentials above
