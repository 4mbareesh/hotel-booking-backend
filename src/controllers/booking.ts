import { Request, Response } from 'express'
import { RoomType, Booking } from '../models'
import mongoose from 'mongoose'

// Interface for booking creation
interface CreateBookingBody {
  roomTypeId: string
  customerName: string
  customerPhone: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
}

// Interface for booking update
interface UpdateBookingBody {
  customerName?: string
  customerPhone?: string
  numberOfGuests?: number
  status?: 'confirmed' | 'cancelled'
}

// Create a new booking
export const createBooking = async (req: Request<{}, {}, CreateBookingBody>, res: Response): Promise<void> => {
  try {
    const { roomTypeId, customerName, customerPhone, checkInDate, checkOutDate, numberOfGuests } = req.body

    // Validate required fields
    if (!roomTypeId || !customerName || !customerPhone || !checkInDate || !checkOutDate || !numberOfGuests) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: roomTypeId, customerName, customerPhone, checkInDate, checkOutDate, numberOfGuests'
      })
      return
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room type ID'
      })
      return
    }

    // Parse and validate dates
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD format'
      })
      return
    }

    // Validate date logic
    if (checkOut <= checkIn) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      })
      return
    }

    // Validate dates are not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (checkIn < today) {
      res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      })
      return
    }

    // Validate guest count
    if (numberOfGuests < 1) {
      res.status(400).json({
        success: false,
        message: 'Number of guests must be at least 1'
      })
      return
    }

    // Find the room type
    const roomType = await RoomType.findById(roomTypeId)
    if (!roomType) {
      res.status(404).json({
        success: false,
        message: 'Room type not found'
      })
      return
    }

    // Validate guest count against room capacity
    if (numberOfGuests > roomType.maxOccupancy) {
      res.status(400).json({
        success: false,
        message: `Number of guests (${numberOfGuests}) exceeds room capacity (${roomType.maxOccupancy})`
      })
      return
    }

    // Check availability - count overlapping bookings
    const overlappingBookings = await Booking.countDocuments({
      roomTypeId: new mongoose.Types.ObjectId(roomTypeId),
      status: 'confirmed',
      $or: [
        {
          checkInDate: { $lte: checkOut },
          checkOutDate: { $gte: checkIn }
        }
      ]
    })

    const availableRooms = roomType.totalQuantity - overlappingBookings

    if (availableRooms <= 0) {
      res.status(409).json({
        success: false,
        message: 'No rooms available for the selected dates',
        availability: {
          totalRooms: roomType.totalQuantity,
          bookedRooms: overlappingBookings,
          availableRooms: 0
        }
      })
      return
    }

    // Calculate total price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const totalPrice = roomType.pricePerNight * nights

    // Create the booking
    const booking = new Booking({
      roomTypeId: new mongoose.Types.ObjectId(roomTypeId),
      roomTypeName: roomType.name,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      pricePerNight: roomType.pricePerNight,
      totalPrice,
      bookingDate: new Date(),
      status: 'confirmed'
    })

    const savedBooking = await booking.save()

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: savedBooking,
        roomType: {
          name: roomType.name,
          description: roomType.description,
          maxOccupancy: roomType.maxOccupancy
        },
        summary: {
          bookingId: savedBooking._id,
          customerName: savedBooking.customerName,
          roomType: roomType.name,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          nights,
          guests: numberOfGuests,
          pricePerNight: roomType.pricePerNight,
          totalPrice,
          status: 'confirmed'
        }
      }
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    
    // Handle mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message)
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get all bookings (Admin)
export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '10' } = req.query

    const pageNumber = parseInt(page as string, 10)
    const limitNumber = parseInt(limit as string, 10)
    const skip = (pageNumber - 1) * limitNumber

    // Build filter
    const filter: any = {}
    if (status && (status === 'confirmed' || status === 'cancelled')) {
      filter.status = status
    }

    const bookings = await Booking.find(filter)
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate('roomTypeId', 'name description maxOccupancy')

    const total = await Booking.countDocuments(filter)

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: bookings
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get booking by ID
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      })
      return
    }

    const booking = await Booking.findById(id).populate('roomTypeId', 'name description maxOccupancy')

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: booking
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get bookings by customer phone
export const getBookingsByPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.params

    if (!phone) {
      res.status(400).json({
        success: false,
        message: 'Phone number is required'
      })
      return
    }

    const bookings = await Booking.find({ customerPhone: phone })
      .sort({ bookingDate: -1 })
      .populate('roomTypeId', 'name description maxOccupancy')

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
      customerPhone: phone
    })
  } catch (error) {
    console.error('Error fetching customer bookings:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching customer bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Update booking (mainly for status changes)
export const updateBooking = async (req: Request<{ id: string }, {}, UpdateBookingBody>, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updates = req.body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      })
      return
    }

    // Validate status if provided
    if (updates.status && !['confirmed', 'cancelled'].includes(updates.status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be either "confirmed" or "cancelled"'
      })
      return
    }

    // Validate guest count if provided
    if (updates.numberOfGuests !== undefined && updates.numberOfGuests < 1) {
      res.status(400).json({
        success: false,
        message: 'Number of guests must be at least 1'
      })
      return
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
      return
    }

    // If changing guest count, validate against room capacity
    if (updates.numberOfGuests && updates.numberOfGuests !== booking.numberOfGuests) {
      const roomType = await RoomType.findById(booking.roomTypeId)
      if (roomType && updates.numberOfGuests > roomType.maxOccupancy) {
        res.status(400).json({
          success: false,
          message: `Number of guests (${updates.numberOfGuests}) exceeds room capacity (${roomType.maxOccupancy})`
        })
        return
      }
    }

    // Trim string fields
    if (updates.customerName) updates.customerName = updates.customerName.trim()
    if (updates.customerPhone) updates.customerPhone = updates.customerPhone.trim()

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('roomTypeId', 'name description maxOccupancy')

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    
    // Handle mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(err => err.message)
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Cancel booking (convenience endpoint)
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      })
      return
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
      return
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      })
      return
    }

    booking.status = 'cancelled'
    const updatedBooking = await booking.save()

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}