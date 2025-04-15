# 日本の建築マップ (Japanese Architecture Map)

An interactive database and map application for Japanese architectural works.

## Overview

This application provides a comprehensive database of architectural works in Japan, allowing users to browse, search, and visualize buildings on an interactive map. Users can explore architectural works by various criteria including location, architect, year, and style.

## Features

- **Building Database**: Browse and search through a comprehensive collection of Japanese architectural works
- **Architect Profiles**: Explore information about architects and their works
- **Interactive Map**: Visualize buildings on a map with filtering options
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Bilingual Support**: Interface available in Japanese and English
- **Offline Capability**: Works even with limited connectivity

## Technology Stack

### Frontend
- React 19.0.0
- TypeScript 5.8.2
- Material UI 6.4.8
- Leaflet 1.9.4 (for maps)
- React Router 7.4.0

### Backend
- Node.js
- Express 4.21.2
- SQLite3 5.1.7 (with sql.js for browser access)

### Build Tools
- Webpack 5.98.0
- TypeScript 5.8.2

### Testing
- Jest
- React Testing Library
- Playwright for E2E testing

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bob-takuya/archi-site.git
cd archi-site
```

2. Install dependencies:
```bash
npm install
```

3. Prepare the database:
```bash
npm run prepare-db
```

4. Start the development server:
```bash
npm run dev
```

This will start both the backend server and the frontend development server. The application will be available at http://localhost:8080.

## Development

### Project Structure

```
archi-site/
├── public/            # Static assets
├── scripts/           # Build and utility scripts
├── server/            # Backend API server
│   ├── middleware/    # Express middleware
│   ├── routes/        # API routes
│   └── utils/         # Server utilities
├── src/               # Frontend source code
│   ├── components/    # React components
│   │   └── ui/        # Reusable UI components
│   ├── context/       # React contexts for state management
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API and database services
│   │   └── db/        # Database access modules
│   ├── styles/        # CSS styles
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
└── tests/             # Test files
    ├── unit/          # Unit tests
    └── screenshots/   # Test screenshots
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run prepare-db` - Prepare database for development

## Testing

### Unit Tests

Run unit tests with:

```bash
npm test
```

### End-to-End Tests

Run E2E tests with:

```bash
npm run test:e2e
```

To view test reports:

```bash
npx playwright show-report test-results/reports
```

## Deployment

### Build for Production

```bash
npm run build
```

This will create optimized production builds in the `dist` directory.

### Start Production Server

```bash
npm start
```

### GitHub Pages Deployment

This application has transitioned from server-side SQLite to static hosting on GitHub Pages. Deployment is automated via GitHub Actions upon pushing to the main branch.

#### Deployment Workflow

1. GitHub Actions workflow is defined in `.github/workflows/deploy.yml`
2. Build process:
   - Run tests (lint, type-check, unit tests, E2E tests)
   - Convert database to static files (`scripts/prepare-static-db.js`)
   - Build the application using Vite
   - Add necessary headers and static files
3. Deploy to the `gh-pages` branch
4. Post-build audits (Lighthouse, link checks)

#### Key Technical Elements

- **Client-side Database**: Streaming large SQLite databases using SQL.js and sql.js-httpvfs
- **SPA Routing**: Client-side routing with HashRouter
- **Performance Optimization**:
  - Caching database queries
  - Bundle optimization and splitting
  - Static asset caching settings
- **Security**: Enable SharedArrayBuffer with COOP/COEP headers

#### Post-Deployment Verification

- **Production URL**: https://bob-takuya.github.io/archi-site/
- **Verification Checklist**:
  1. Database connection
  2. Map display and interaction
  3. Search functionality
  4. Detail page rendering
  5. Responsive design
- **Audit Results**: Check Lighthouse scores and link check results from GitHub Actions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Data sourced from various architectural archives and publications
- Thanks to the Shinkenchiku magazine for inspiration and references