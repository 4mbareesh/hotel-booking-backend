import { Request, Response } from 'express'
import { RoomType, Booking } from '../models'
import mongoose from 'mongoose'

// Interface for search query parameters
interface SearchQuery {
  checkIn: string
  checkOut: string
  guests: string
}

// Search available rooms by date range and guest count
export const searchAvailableRooms = async (
  req: Request<{}, {}, {}, SearchQuery>,
  res: Response
): Promise<void> => {
  try {
    const { checkIn, checkOut, guests } = req.query

    // Validate required parameters
    if (!checkIn || !checkOut || !guests) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: checkIn, checkOut, and guests are required',
        example: 'GET /api/search?checkIn=2024-12-01&checkOut=2024-12-03&guests=2'
      })
      return
    }

    // Parse and validate dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const numberOfGuests = parseInt(guests, 10)

    // Validate date formats
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format',
        example: 'checkIn=2024-12-01&checkOut=2024-12-03'
      })
      return
    }

    // Validate guest count
    if (isNaN(numberOfGuests) || numberOfGuests < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid guest count. Must be a positive number',
        example: 'guests=2'
      })
      return
    }

    // Validate date logic
    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      })
      return
    }

    // Validate dates are not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkInDate < today) {
      res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      })
      return
    }

    // Find room types that can accommodate the number of guests
    const suitableRoomTypes = await RoomType.find({
      maxOccupancy: { $gte: numberOfGuests }
    })

    if (suitableRoomTypes.length === 0) {
      res.status(200).json({
        success: true,
        message: `No room types found that can accommodate ${numberOfGuests} guests`,
        data: [],
        searchCriteria: {
          checkIn: checkInDate.toISOString().split('T')[0],
          checkOut: checkOutDate.toISOString().split('T')[0],
          guests: numberOfGuests
        }
      })
      return
    }

    // For each suitable room type, calculate availability
    const availableRooms = await Promise.all(
      suitableRoomTypes.map(async (roomType) => {
        // Count overlapping bookings for this room type in the date range
        const overlappingBookings = await Booking.countDocuments({
          roomTypeId: roomType._id,
          status: 'confirmed',
          $or: [
            {
              checkInDate: { $lte: checkOutDate },
              checkOutDate: { $gte: checkInDate }
            }
          ]
        })

        // Calculate available rooms
        const availableCount = roomType.totalQuantity - overlappingBookings

        return {
          _id: roomType._id,
          name: roomType.name,
          description: roomType.description,
          maxOccupancy: roomType.maxOccupancy,
          pricePerNight: roomType.pricePerNight,
          totalQuantity: roomType.totalQuantity,
          availableCount: Math.max(0, availableCount), // Ensure non-negative
          isAvailable: availableCount > 0,
          isActive: roomType.isActive,
          // Calculate total price for the stay
          totalPrice:
            roomType.pricePerNight *
            Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
          createdAt: roomType.createdAt,
          updatedAt: roomType.updatedAt
        }
      })
    )

    // Filter to only show available rooms
    const availableRoomsOnly = availableRooms

    // Sort by price (ascending)
    availableRoomsOnly.sort((a, b) => a.pricePerNight - b.pricePerNight)

    res.status(200).json({
      success: true,
      message:
        availableRoomsOnly.length > 0
          ? `Found ${availableRoomsOnly.length} available room type(s)`
          : 'No rooms available for the selected dates and guest count',
      count: availableRoomsOnly.length,
      data: availableRoomsOnly,
      searchCriteria: {
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        guests: numberOfGuests,
        nights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    })
  } catch (error) {
    console.error('Error searching available rooms:', error)
    res.status(500).json({
      success: false,
      message: 'Error searching available rooms',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get room availability for a specific room type (optional endpoint)
export const getRoomTypeAvailability = async (
  req: Request<{ id: string }, {}, {}, SearchQuery>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { checkIn, checkOut } = req.query

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room type ID'
      })
      return
    }

    // Validate required parameters
    if (!checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: checkIn and checkOut are required'
      })
      return
    }

    // Parse and validate dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format'
      })
      return
    }

    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      })
      return
    }

    // Find the room type
    const roomType = await RoomType.findById(id)
    if (!roomType) {
      res.status(404).json({
        success: false,
        message: 'Room type not found'
      })
      return
    }

    // Count overlapping bookings
    const overlappingBookings = await Booking.countDocuments({
      roomTypeId: roomType._id,
      status: 'confirmed',
      $or: [
        {
          checkInDate: { $lte: checkOutDate },
          checkOutDate: { $gte: checkInDate }
        }
      ]
    })

    const availableCount = Math.max(0, roomType.totalQuantity - overlappingBookings)

    res.status(200).json({
      success: true,
      data: {
        roomType: {
          _id: roomType._id,
          name: roomType.name,
          description: roomType.description,
          maxOccupancy: roomType.maxOccupancy,
          pricePerNight: roomType.pricePerNight,
          totalQuantity: roomType.totalQuantity
        },
        availability: {
          totalQuantity: roomType.totalQuantity,
          bookedCount: overlappingBookings,
          availableCount: availableCount,
          isAvailable: availableCount > 0
        },
        searchCriteria: {
          checkIn: checkInDate.toISOString().split('T')[0],
          checkOut: checkOutDate.toISOString().split('T')[0],
          nights: Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        }
      }
    })
  } catch (error) {
    console.error('Error getting room type availability:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting room type availability',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
