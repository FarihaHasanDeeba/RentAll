# RentAll Frontend - Module 3

React frontend for the RentAll Module 3: Rental Lifecycle Tracking system.

## Features Implemented

### Feature 11: Submit Rent Request
- Interactive rental request form
- Item selection with pricing
- Date range picker with validation
- Real-time cost calculation
- Deposit estimation

### Feature 12: Asset Status Workflow Engine
- Status update interface
- Visual status flow diagram
- Complete status history tracking
- Status transition validation

### Feature 13: Geographic Exchange Mapper
- Pickup location configuration
- Handover spot proposal system
- Coordinate input interface
- Confirmation status display

### Feature 14: Handover Verification Handshake
- OTP generation interface
- OTP verification form
- Security feature documentation
- Handover status tracking

### Feature 15: Damage Incident Logger
- Damage reporting form
- Cost estimation
- Photo upload interface
- Escrow status display

## Getting Started

### Prerequisites
- Node.js and npm
- Backend server running on port 5000

### Installation

```bash
cd frontend
npm install
```

### Running the Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Home.jsx              # Landing page with feature overview
│   │   ├── Home.css
│   │   ├── SubmitRentRequest.jsx # Feature 11: Rental request form
│   │   ├── SubmitRentRequest.css
│   │   ├── RentalDashboard.jsx   # Main dashboard with rental list
│   │   ├── RentalDashboard.css
│   │   ├── RentalDetails.jsx     # Detailed rental management
│   │   └── RentalDetails.css
│   ├── App.jsx                   # Main app with routing
│   ├── App.css
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Navigation

- **Home** (`/`) - Feature overview and getting started
- **Submit Request** (`/submit-request`) - Create new rental requests
- **Dashboard** (`/dashboard`) - View and manage all rentals
- **Rental Details** (`/rental/:rentalId`) - Detailed rental management with all features

## API Integration

The frontend uses axios to communicate with the backend API:

```javascript
// Example API call
const response = await axios.post('/api/rentals', formData)
```

All API calls are proxied through Vite to avoid CORS issues.

## Features by Page

### Home Page
- Feature overview cards
- Lifecycle flow diagram
- Navigation to main features

### Submit Rent Request Page
- Item selection dropdown
- Date range picker
- Real-time cost calculation
- Form validation
- Success/error handling

### Dashboard Page
- Rental statistics
- Filtering by status
- Rental cards with key information
- Quick access to detailed management
- Status indicators

### Rental Details Page
- **Overview Tab**: Complete rental information and status history
- **Status Workflow Tab**: Update rental status with visual flow diagram
- **Location Tab**: Set pickup locations and propose handover spots
- **Handover Tab**: Generate and verify OTPs for secure handover
- **Damage Tab**: Report damage incidents with escrow freezing

## Styling

The application uses custom CSS with:
- Responsive design
- Status-based color coding
- Interactive hover effects
- Mobile-friendly layouts
- Consistent design system

## Demo Data

The frontend includes demo data that displays when the backend API is unavailable, allowing you to test the UI even without database connectivity.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile and desktop

## Development Notes

- The frontend runs on port 3000
- Backend API runs on port 5000
- Vite proxy handles API calls to avoid CORS
- Hot module replacement enabled for development