# FreshCue

FreshCue is a full-stack food inventory and recipe-planning application designed to help users keep track of the food they already have, understand what needs using first and turn that information into practical actions.

The project is actively being developed around a simple product goal:

> **FreshCue tells you what food to use next — and the easiest way to use it.**

Rather than acting as a passive inventory list, FreshCue aims to use expiry, inventory and recipe data to help reduce avoidable household food waste.

## Current features

### Inventory management

- Dashboard showing active inventory
- Expiry-based urgency indicators
- Add, edit and delete inventory items
- Persistent inventory storage using PostgreSQL
- Search inventory by item name
- Filter inventory by storage location
- Track quantity, unit, storage location, category, brand and barcode
- Responsive inventory forms
- Accessible validation and error feedback

### Barcode product entry

- Manual barcode entry and product lookup
- Product lookup using Open Food Facts
- Product name and brand prefill from recognised barcodes
- FreshCue category suggestions from provider product data
- Safe package quantity and unit prefill where possible
- User-editable barcode-derived suggestions before inventory submission
- Camera-based barcode scanning
- EAN-13, EAN-8, UPC-A and UPC-E barcode detection
- Rear-camera preference on supported mobile devices
- Automatic product lookup after a successful scan
- Duplicate scan prevention
- Camera permission, cancellation and unsupported-browser handling
- Manual barcode entry retained as a fallback

### Recipe discovery

- Recipe suggestions based on active inventory ingredients
- Real recipe data from the Spoonacular API
- Available and missing ingredient identification
- Recipe ranking based on the number of missing ingredients
- Loading, error and empty states
- Provider responses mapped into FreshCue-owned recipe models

### Shopping list

- Generate shopping-list items from ingredients missing from a selected recipe
- Add shopping-list items manually
- Prevent duplicate ingredients
- Update the list as items are added

## Product goal

FreshCue aims to turn household food inventory and expiry information into useful decisions:

- What needs using soon?
- What can I make from the food I already have?
- Which recipes require the least additional shopping?
- What ingredients am I missing?
- Which food could be rescued before it is wasted?
- What food is regularly being consumed or wasted?

The longer-term direction is to make these decisions increasingly intelligent through expiry-aware recommendations, low-effort meal suggestions and measurable food-waste insights.

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- CSS
- ZXing Browser

### Backend

- Node.js
- Express
- TypeScript
- REST APIs

### Data and integrations

- PostgreSQL
- Spoonacular API
- Open Food Facts API

### Development workflow

- Git
- GitHub Issues
- Feature branches
- Pull requests
- ESLint
- Vitest
- TypeScript build checks

## Architecture

FreshCue separates its React frontend from a Node.js and Express backend.

The frontend communicates with REST API routes for inventory, recipe and product data. Inventory is persisted in PostgreSQL, while external providers are used for recipe discovery and packaged-food identification.

Provider-specific integrations are kept behind the backend API. External responses are mapped into FreshCue-owned data models before being returned to the frontend, keeping provider details separate from the application's core product logic.

Barcode scanning is also kept separate from product identification. The camera scanner is responsible only for detecting a barcode value. That barcode is then passed into the existing FreshCue product lookup flow, which remains responsible for identifying the product and supplying data to the inventory form.

API credentials and database configuration are stored using environment variables and are not exposed to the client or committed to source control.

## Barcode workflow

FreshCue supports both manual and camera-based barcode entry.

A successful camera scan follows the same product workflow as a manually entered barcode:

```text
Camera scan
    ↓
Barcode detected
    ↓
FreshCue product lookup
    ↓
Provider response mapped to FreshCue product data
    ↓
Inventory form prefilled
    ↓
User reviews or edits values
    ↓
Explicit Add item submission
    ↓
PostgreSQL
```

Recognised product data is treated as a suggestion rather than automatically creating inventory. Users remain in control of every prefilled value before an item is saved.

## Recipe search

Recipe suggestions are generated using ingredients from the user's current active inventory.

FreshCue validates ingredient matches before presenting them as available and identifies ingredients that would still need to be purchased.

Recipes are currently prioritised using the number of missing ingredients, providing the foundation for more advanced recommendation scoring based on expiry urgency, shopping effort and food-rescue value.

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

The backend requires the relevant environment variables, including API credentials and PostgreSQL database configuration.

## Roadmap

Planned development includes:

- Faster expiry-date capture
- Bulk barcode scanning and batch inventory review
- Quick inventory lifecycle actions
- Consumed and wasted food tracking
- Faster quantity adjustments
- Shopping-list completion and purchased-item workflows
- Expiry-aware recipe recommendation scoring
- **Use First** recommendations for ingredients nearing expiry
- **Rescue Mode** for finding practical ways to use high-priority food
- Shopping-effort-aware recommendations
- Explainable recipe recommendation scoring
- Daily action summaries
- Food-waste impact and rescue insights
- Dashboard and design-system improvements
- Receipt scanning and OCR-assisted inventory import
- Broader automated test coverage
- User preferences and personalisation

## Project status

FreshCue is under active development.

Core inventory management, PostgreSQL persistence, inventory-based recipe discovery, shopping-list generation, packaged-food lookup, inventory-form prefilling and camera barcode scanning are implemented.

Development is continuing incrementally through focused GitHub issues, feature branches and pull requests, with the next phase centred on making inventory entry faster and turning stored food data into increasingly useful recommendations.
