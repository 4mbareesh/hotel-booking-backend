# Hotel Booking System - Backend API

A Node.js/Express.js backend API for a hotel booking system built with TypeScript and MongoDB. This system provides room management, availability search, and booking functionality.

## 🏗️ Project Overview

This is a simplified hotel booking system backend that provides:
- **Room Type Management**: CRUD operations for different room types
- **Availability Search**: Real-time room availability based on dates and guest count
- **Booking System**: Create bookings with automatic availability validation
- **Database Integration**: MongoDB with Mongoose ODM for data persistence

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Development Tools**: tsx for hot reloading, Prettier for formatting
- **Package Manager**: pnpm

## 📦 Dependencies

### Core Dependencies
- `express` - Web application framework
- `mongoose` - MongoDB object modeling
- `cors` - Cross-origin resource sharing
- `morgan` - HTTP request logger
- `tsx` - TypeScript execution engine

### Development Dependencies
- `typescript` - TypeScript compiler
- `@types/*` - Type definitions
- `prettier/biome` - Code formatting

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager
- MongoDB database (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <folder>
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory(refer `.env.example`)

4. **Start the development server**
   ```bash
   pnpm run dev
   ```

   The server will start on `http://localhost:5000` with hot reloading enabled.

### Production Build

```bash
# Build the project
pnpm run build

# Start production server
pnpm start
```

## 📊 Database Schema

### Room Types Collection
```javascript
{
  _id: ObjectId,
  name: String,              // e.g., "Deluxe Room"
  description: String,       // Room description
  maxOccupancy: Number,      // Maximum number of guests
  pricePerNight: Number,     // Price in rupees
  totalQuantity: Number,     // Total rooms of this type
  createdAt: Date,
  updatedAt: Date
}
```

### Bookings Collection
```javascript
{
  _id: ObjectId,
  roomTypeId: ObjectId,      // Reference to roomTypes
  roomTypeName: String,      // Denormalized for quick access
  customerName: String,
  customerPhone: String,
  checkInDate: Date,
  checkOutDate: Date,
  numberOfGuests: Number,
  pricePerNight: Number,
  totalPrice: Number,
  bookingDate: Date,         // When booking was made
  status: String,            // "confirmed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Health Check
- **GET** `/api` - Server health check

### Room Type Management

#### Get All Room Types
```http
GET /api/rooms
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64f8d2b3c9a1234567890abc",
      "name": "Deluxe Room",
      "description": "Luxurious room with city view",
      "maxOccupancy": 2,
      "pricePerNight": 3000,
      "totalQuantity": 10,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Get Room Type by ID
```http
GET /api/rooms/:id
```

#### Create Room Type
```http
POST /api/rooms
Content-Type: application/json

{
  "name": "Deluxe Room",
  "description": "Luxurious room with city view and modern amenities",
  "maxOccupancy": 2,
  "pricePerNight": 3000,
  "totalQuantity": 10
}
```

#### Update Room Type
```http
PUT /api/rooms/:id
Content-Type: application/json

{
  "name": "Updated Room Name",
  "description": "Updated description",
  "maxOccupancy": 3,
  "pricePerNight": 3500,
  "totalQuantity": 8
}
```

#### Delete Room Type
```http
DELETE /api/rooms/:id
```

### Room Search & Availability

#### Search Available Rooms
```http
GET /api/search?checkIn=2024-12-01&checkOut=2024-12-03&guests=2
```

**Query Parameters:**
- `checkIn` (required): Check-in date in YYYY-MM-DD format
- `checkOut` (required): Check-out date in YYYY-MM-DD format
- `guests` (required): Number of guests

**Response:**
```json
{
  "success": true,
  "searchCriteria": {
    "checkInDate": "2024-12-01T00:00:00.000Z",
    "checkOutDate": "2024-12-03T00:00:00.000Z",
    "numberOfGuests": 2,
    "nights": 2
  },
  "availableRooms": [
    {
      "_id": "64f8d2b3c9a1234567890abc",
      "name": "Deluxe Room",
      "description": "Luxurious room with city view",
      "maxOccupancy": 2,
      "pricePerNight": 3000,
      "totalQuantity": 10,
      "availableCount": 8,
      "totalPrice": 6000
    }
  ]
}
```

#### Check Room Type Availability
```http
GET /api/search/room/:id?checkIn=2024-12-01&checkOut=2024-12-03
```

### Booking Management

#### Create Booking
```http
POST /api/book
Content-Type: application/json

{
  "roomTypeId": "64f8d2b3c9a1234567890abc",
  "customerName": "John Doe",
  "customerPhone": "+91-9876543210",
  "checkInDate": "2024-12-01",
  "checkOutDate": "2024-12-03",
  "numberOfGuests": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "_id": "64f8d2b3c9a1234567890def",
    "roomTypeId": "64f8d2b3c9a1234567890abc",
    "roomTypeName": "Deluxe Room",
    "customerName": "John Doe",
    "customerPhone": "+91-9876543210",
    "checkInDate": "2024-12-01T00:00:00.000Z",
    "checkOutDate": "2024-12-03T00:00:00.000Z",
    "numberOfGuests": 2,
    "pricePerNight": 3000,
    "totalPrice": 6000,
    "bookingDate": "2024-01-15T10:30:00.000Z",
    "status": "confirmed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔍 Business Logic

### Availability Calculation

The system calculates room availability using the following logic:

1. **Find Suitable Room Types**: Filter rooms where `maxOccupancy >= numberOfGuests`
2. **Count Overlapping Bookings**: Count confirmed bookings that overlap with the requested date range
3. **Calculate Available Rooms**: `availableCount = totalQuantity - overlappingBookings`
4. **Return Available Rooms**: Only return rooms with `availableCount > 0`

### Date Overlap Detection

Two bookings overlap if:
```
(Booking A check-in <= Booking B check-out) AND (Booking A check-out >= Booking B check-in)
```

### Validation Rules

- **Dates**: Check-out date must be after check-in date
- **Past Dates**: No bookings allowed for past dates
- **Guest Count**: Must not exceed room's `maxOccupancy`
- **Phone**: Basic format validation with regex
- **Availability**: Automatic validation before booking creation

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── booking.ts      # Booking operations
│   │   ├── room-type.ts    # Room type CRUD
│   │   └── search.ts       # Search & availability
│   ├── models/             # Database models
│   │   ├── booking.ts      # Booking schema
│   │   ├── room-type.ts    # Room type schema
│   │   └── index.ts        # Model exports
│   ├── routes/             # API routes
│   │   ├── booking.ts      # POST /api/book
│   │   ├── room-type.ts    # /api/rooms/*
│   │   ├── search.ts       # /api/search/*
│   │   └── index.ts        # Route aggregation
│   ├── lib/
│   │   ├── constants/      # App constants
│   │   └── utils/          # Utility functions
│   │       └── db.ts       # Database connection
│   └── index.ts            # Application entry point
├── bruno/                  # API testing collection
├── package.json
├── tsconfig.json
└── .env                    # Environment variables
```

## 🧪 Testing

The project includes test files for API validation:

```bash
# Test individual APIs
node tests/test-api.js
node tests/test-search-api.js
```

### API Testing with Bruno

The project includes a Bruno collection for API testing:
- Import the `bruno/` folder into Bruno
- Update the environment variables in `bruno/environments/local.bru`
- Test all endpoints interactively

## 🔧 Development Scripts

```bash
# Development with hot reload
pnpm run dev

# Build TypeScript to JavaScript
pnpm run build

# Start production server
pnpm start

# Format code
pnpm run format

# Check code formatting
pnpm run check-format

# Type checking
pnpm run check-types

# Clean build files
pnpm run clean
```

## 🌐 CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (React development server)
- `http://127.0.0.1:3000`
- Environment-specific URLs (`CLIENT_URL`, `SERVER_URL`)

## 🚦 Error Handling

The API provides consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Sample Data

For testing purposes, you can create room types like:

```json
[
  {
    "name": "Deluxe Room",
    "description": "Luxurious room with city view, king-size bed, and modern amenities",
    "maxOccupancy": 2,
    "pricePerNight": 3000,
    "totalQuantity": 10
  },
  {
    "name": "Family Suite",
    "description": "Spacious suite with two bedrooms, perfect for families",
    "maxOccupancy": 4,
    "pricePerNight": 6000,
    "totalQuantity": 5
  },
  {
    "name": "Executive Room",
    "description": "Premium room with workspace and premium amenities",
    "maxOccupancy": 2,
    "pricePerNight": 4500,
    "totalQuantity": 8
  }
]
```

<!-- ## 🔄 Future Enhancements

- User authentication and authorization
- Payment gateway integration
- Email notifications
- Booking cancellation with refund logic
- Room service requests
- Advanced reporting and analytics -->

## 📄 License

This project is licensed under the ISC License.