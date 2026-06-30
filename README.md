# LinkHub

**LinkHub** is a premium, minimalist productivity tool designed to organize project-related links (documents, spreadsheets, slides, drives, repositories, Figma specs, and Notion nodes) into clean, customizable folder tiles. 

It features zero-friction anonymous authentication, automatic link type brand icon detection, project sharing, hash routing browser navigation history, default light theme styling, and a responsive square tile design.

---

## Features

- **Frictionless Anonymous Onboarding**: Start organizing links instantly with only your name. No email, passwords, or registration barriers.
- **Accurate Recovery Codes**: Get a masked 6-digit recovery key (`XXXXXX`) on your dashboard to restore your projects and settings on other browsers or devices.
- **Square Project Folders & Descriptions**: Organize your workspaces in clean square grid cards. Add optional descriptions to annotate your project directories.
- **URL-based Brand Favicons**: Distinguish between Google Docs, Google Sheets (Excel), Google Slides, Google Drive, and Google Photos links. Rather than using generic Google G favicons, the app displays custom, high-resolution branding assets. It also displays official logos for GitHub, Figma, Notion, Slack, Discord, Microsoft Teams, Word, PowerPoint, OneDrive, Dropbox, and Zoom out-of-the-box.
- **Interactive Square Link Tiles**: Saved links display as square tiles. Hovering over a tile reveals action triggers (Copy Link, Open Tab, Edit, Delete). Clicking anywhere on the tile opens the target URL.
- **Browser History Integration**: Integrated URL hash router (`#/project/:projectId`) enables the browser's Back and Forward buttons to navigate between folders correctly rather than exiting the application.
- **Deep-Link Project Sharing**: Click the share icon next to a project title to copy a share URL (e.g. `#/share/:projectId`). Opening this link clones the project and its links directly into another user's workspace.
- **Light/Dark Themes**: Fully persistent Light and Dark themes, optimized for modern visual aesthetics.

---

## Tech Stack

- **Frontend**: React (SPA), Vite, TypeScript, Lucide React.
- **Styling**: Vanilla CSS with HSL variables design tokens.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (Supabase client pool) with an automated JSON file fallback (`db.json`) for local offline development.

---

## File Structure

```text
├── api/                   # Vercel Serverless entry folder
│   └── index.js           # Serverless route mapping to Express app
├── public/                # Static public assets (Favicon, tab icon)
├── server/                # Node.js Express backend
│   ├── db.js              # Database client routing layer (PostgreSQL + Local fallback)
│   ├── schema.sql         # SQL schema definitions for Supabase/PostgreSQL
│   └── server.js          # REST API endpoints handlers
├── src/                   # React TypeScript frontend
│   ├── components/        # Frontend visual components
│   │   ├── DashboardView.tsx   # Dashboard grid and links layout
│   │   ├── LandingView.tsx     # Onboarding forms
│   │   ├── LinkModal.tsx       # Accessible dialog wrapper for adding links
│   │   └── ProjectModal.tsx    # Accessible dialog wrapper for adding projects
│   ├── api.ts             # Typed API fetch helper client
│   ├── App.tsx            # Session controller and hash router
│   ├── index.css          # Design system variables, animations, grids
│   └── main.tsx           # React bootstrap entry
├── vercel.json            # Vercel monorepo routing configurations
├── package.json           # Scripts and dependencies
└── tsconfig.json          # TypeScript configurations
```

---

## Local Development Setup

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/yourusername/LinkHub.git
cd LinkHub
npm install
```

### 3. Run Development Server
By default, the server operates in **Local JSON fallback mode** if no database connection string is set:
```bash
npm run dev
```
This concurrently starts:
- The frontend client on [http://localhost:5173/](http://localhost:5173/)
- The Express API server on [http://localhost:3001/](http://localhost:3001/)
