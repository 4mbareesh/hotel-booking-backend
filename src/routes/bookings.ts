import { Router, type Router as ExpressRouter } from 'express'
import {
  getAllBookings,
  getBookingById,
  getBookingsByPhone,
  updateBooking,
  cancelBooking
} from '../controllers/booking'

const router: ExpressRouter = Router()

// Routes for /api/bookings (Booking Management)

// GET /api/bookings - Get all bookings (Admin - with pagination and filtering)
// Query parameters: status, page, limit
// Example: GET /api/bookings?status=confirmed&page=1&limit=10
router.get('/', getAllBookings)

// GET /api/bookings/customer/:phone - Get bookings by customer phone (must come before /:id)
router.get('/customer/:phone', getBookingsByPhone)

// GET /api/bookings/:id - Get a specific booking by ID
router.get('/:id', getBookingById)

// PUT /api/bookings/:id - Update booking details
router.put('/:id', updateBooking)

// PUT /api/bookings/:id/cancel - Cancel a booking (convenience endpoint)
router.put('/:id/cancel', cancelBooking)

export default router