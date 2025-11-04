import { Router, type Router as ExpressRouter } from 'express'
import {
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  updateRoomTypeAvailability
} from '../controllers/room-type'

const router: ExpressRouter = Router()

// GET /api/rooms - Get all room types
router.get('/', getAllRoomTypes)

// GET /api/rooms/:id - Get a single room type by ID
router.get('/:id', getRoomTypeById)

// POST /api/rooms - Create a new room type
router.post('/', createRoomType)

// PUT /api/rooms/:id - Update a room type
router.put('/:id', updateRoomType)

// DELETE /api/rooms/:id - Delete a room type
router.delete('/:id', deleteRoomType)

router.post('/update/:id', updateRoomTypeAvailability)

export default router
