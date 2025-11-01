import { Router, type Router as ExpressRouter } from 'express'
import {
  searchAvailableRooms,
  getRoomTypeAvailability
} from '../controllers/search'

const router: ExpressRouter = Router()

// GET /api/search - Search available rooms by date range and guest count
// Query parameters: checkIn, checkOut, guests
// Example: GET /api/search?checkIn=2024-12-01&checkOut=2024-12-03&guests=2
router.get('/', searchAvailableRooms)

// GET /api/search/room/:id - Get availability for a specific room type
// Query parameters: checkIn, checkOut
// Example: GET /api/search/room/60d5ecb54b24a10004c8b8a5?checkIn=2024-12-01&checkOut=2024-12-03
router.get('/room/:id', getRoomTypeAvailability)

export default router