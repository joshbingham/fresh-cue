# FreshCue

FreshCue is a full-stack food inventory and recipe-planning application designed to help users track expiry dates, prioritise what to use first and make better use of food they already have.

The project is actively being developed, with a focus on turning household food inventory data into clear, practical actions that can help reduce food waste.

## Current features

- Dashboard showing active inventory
- Expiry-based urgency indicators
- Add, edit and delete inventory items
- Persistent inventory storage using PostgreSQL
- Search inventory by item name
- Filter inventory by storage location
- Recipe suggestions based on active inventory ingredients
- Real recipe data from the Spoonacular API
- Available and missing ingredient identification
- Recipe ranking based on the number of missing ingredients
- Loading, error and empty states for recipe search
- Responsive layout
- Accessible forms, validation and error feedback

## Product goal

FreshCue aims to turn household food inventory and expiry information into useful decisions:

- What needs using soon?
- What meals could be made from the food already available?
- What ingredients are missing?
- What food is regularly being wasted?

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Node.js
- Express
- TypeScript
- REST APIs

### Data and integrations

- PostgreSQL
- Spoonacular API

### Development workflow

- Git
- GitHub Issues
- Feature branches
- Pull requests
- ESLint
- TypeScript build checks

## Architecture

FreshCue separates the React frontend from its Node.js and Express backend.

The frontend communicates with REST API routes for inventory and recipe data. Inventory is persisted in PostgreSQL, while recipe searches use active inventory ingredients to retrieve suggestions from an external recipe provider.

Provider-specific recipe logic is isolated within the backend and external responses are mapped into FreshCue's own recipe model before being returned to the frontend.

API credentials are stored using environment variables and are not exposed to the client or committed to source control.

## Recipe search

Recipe suggestions are generated using ingredients from the user's current active inventory.

FreshCue validates ingredient matches before presenting them as available and prioritises recipes with fewer missing ingredients. This keeps the application responsible for how provider data is interpreted rather than exposing external API responses directly to the interface.

## Local development

### Frontend

From the project root:

```bash
npm install
npm run dev
```

### Backend

From the `backend` directory:

```bash
npm install
npm run dev
```

The backend requires the relevant environment variables, including a Spoonacular API key and PostgreSQL database configuration.

## Roadmap

Potential future development includes:

- Barcode scanning and product lookup
- Shopping list generation
- Expiry notifications
- Food waste insights and reporting
- User authentication
- Household sharing
- Automated testing
- Production deployment

## Project status

FreshCue is currently under active development. Core inventory management, PostgreSQL persistence and inventory-based recipe discovery are implemented, with further features being developed incrementally through GitHub issues and feature branches.
