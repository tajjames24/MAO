# BUYWISE - Wholesale Offer Calculator

## Product Overview
A professional real estate wholesale deal analyzer that helps real estate investors quickly calculate Maximum Allowable Offers (MAO), estimate repair costs, and analyze deal profitability.

## UI Design (December 2025)
- **Theme**: Dark gradient backgrounds with orange accents (#FF7A00)
- **Cards**: Rounded corners (2xl), gradient backgrounds, subtle borders
- **Icons**: Each input/section has an icon for visual hierarchy
- **Deal Rating**: Semi-circular gauge showing 0-100 score with color gradient
- **Typography**: Inter font, bold weights for emphasis
- **Tabs**: Pill-shaped with gradient active state and shadow

## Core Features

### 1. Wholesale Deal Calculator
- **Inputs**: After Repair Value (ARV), Repair Cost, Assignment Fee
- **Advanced Options**: 
  - ARV Rule Percentage (60-85%, default 70%)
  - Negotiation Discount (default 10%)
- **Calculations**:
  - 70% Rule Value
  - Maximum Allowable Offer (MAO)
  - First Offer (Anchor price)
  - Buyer Max Purchase Price
  - Investor Profit Estimate
- **Deal Score**: Color-coded rating (Green=Excellent, Yellow=Average, Red=Bad)
- **Actions**: Reset, Save Deal (localStorage), Export PDF, Copy to Clipboard

### 2. Repair Cost Estimator (NEW)
Accessible via tab navigation alongside the Calculator.

#### Quick Estimate by Square Footage
- Enter property square footage
- Select rehab level:
  - Light Rehab: $15–$30/sqft (cosmetic updates, paint, cleaning)
  - Medium Rehab: $35–$50/sqft (windows, A/C, cosmetics)
  - Heavy Rehab: $60–$100/sqft (major systems, structural)
  - Ultra Heavy: $100–$150/sqft (gut rehab, near-new construction)
- Shows estimated cost range and average

#### Advanced Itemized Repairs
Expandable checklist with individual repair costs:
- **Exterior**: Landscape ($2,000), Windows ($300 each), Garage Door ($1,000)
- **Interior**: Kitchen Full ($10,000), Kitchen Light ($5,000), Bathrooms ($2,000-$4,000), Flooring ($5,000), Tile ($3,500), Paint ($3,500), Doors/Trim ($3,000)
- **Mechanicals**: HVAC ($5,000), Roof ($6,000-$7,500), Lighting ($1,500), Hot Water ($1,000)
- **Other**: Demo ($1,500), Cleaning ($350)

#### Reference Table
Shows typical repair costs by property size - **CLICKABLE** to send directly to Calculator:
- Under 1,500 sqft: Light=$18,750, Medium=$37,500, Heavy=$70,000
- 1,500–2,500 sqft: Light=$25,000, Medium=$50,000, Heavy=$90,000
- 2,500–3,500 sqft: Light=$37,500, Medium=$62,500, Heavy=$125,000

#### Behavior
- **Sync to Calculator**: One-click button to transfer repair cost to main calculator
- **Auto-Reset**: Quick Estimate (sqft and rehab level) automatically resets when selecting Advanced Itemized repairs

### 3. UI/UX Features
- **Tab Navigation**: Switch between Calculator and Repair Estimator
- **Dark/Light Mode**: Toggle in header, persisted to localStorage
- **BUYWISE Branding**: Orange primary color theme (#FF7A00)
- **Number Formatting**: Comma-separated currency display
- **Responsive Design**: Works on desktop and mobile

## Technical Stack
- **Frontend**: React, TailwindCSS, shadcn/ui
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (for saved deals feature)
- **State**: localStorage for theme preference and saved deals

## What's Been Removed
- Hamburger menu and sidebar navigation
- Comp Generator feature (AI-powered property comparables)

## Completed Work (December 2025)
- [x] Wholesale Deal Calculator with all formulas
- [x] BUYWISE branding
- [x] Number formatting with commas
- [x] Save Deal / Export PDF / Copy features
- [x] Dark/Light mode toggle
- [x] **NEW**: Tab-based navigation
- [x] **NEW**: Repair Cost Estimator with sqft-based and itemized options
- [x] **NEW**: Sync to Calculator functionality
- [x] **REMOVED**: Hamburger menu, sidebar, Comp Generator

## Architecture
```
/app
├── backend/
│   ├── server.py        # FastAPI - status endpoints
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.js              # Main app with tab navigation
        ├── index.css           # Global styles, dark mode vars
        └── components/
            ├── Calculator.jsx       # Main calculator UI
            ├── RepairEstimator.jsx  # NEW: Repair cost tool
            └── ui/                  # Shadcn UI components
```

## Future Enhancements (Backlog)
- P2: Comp Confidence Score
- P2: Auto Deal Summary generation
- P2: Map view of comparable properties
- P3: User accounts with cloud sync for saved deals
