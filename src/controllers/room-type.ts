import { Request, Response } from 'express'
import RoomType, { IRoomType } from '../models/room-type'
import mongoose from 'mongoose'

// Interface for room type creation/update
interface CreateRoomTypeBody {
  name: string
  description: string
  maxOccupancy: number
  pricePerNight: number
  totalQuantity: number
}

// Get all room types
export const getAllRoomTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const roomTypes = await RoomType.find().sort({ name: 1 })
    res.status(200).json({
      success: true,
      count: roomTypes.length,
      data: roomTypes
    })
  } catch (error) {
    console.error('Error fetching room types:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching room types',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get a single room type by ID
export const getRoomTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room type ID'
      })
      return
    }

    const roomType = await RoomType.findById(id)

    if (!roomType) {
      res.status(404).json({
        success: false,
        message: 'Room type not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: roomType
    })
  } catch (error) {
    console.error('Error fetching room type:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching room type',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Create a new room type
export const createRoomType = async (req: Request<{}, {}, CreateRoomTypeBody>, res: Response): Promise<void> => {
  try {
    const { name, description, maxOccupancy, pricePerNight, totalQuantity } = req.body

    // Validate required fields
    if (!name || !description || !maxOccupancy || !pricePerNight || !totalQuantity) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: name, description, maxOccupancy, pricePerNight, totalQuantity'
      })
      return
    }

    // Validate numeric fields
    if (maxOccupancy < 1 || pricePerNight < 0 || totalQuantity < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid values: maxOccupancy and totalQuantity must be at least 1, pricePerNight must be non-negative'
      })
      return
    }

    // Check if room type with same name already exists
    const existingRoomType = await RoomType.findOne({ name: name.trim() })
    if (existingRoomType) {
      res.status(400).json({
        success: false,
        message: 'Room type with this name already exists'
      })
      return
    }

    const roomType = new RoomType({
      name: name.trim(),
      description: description.trim(),
      maxOccupancy,
      pricePerNight,
      totalQuantity
    })

    const savedRoomType = await roomType.save()

    res.status(201).json({
      success: true,
      message: 'Room type created successfully',
      data: savedRoomType
    })
  } catch (error) {
    console.error('Error creating room type:', error)
    
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

    // Handle duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Room type with this name already exists'
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Error creating room type',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Update a room type
export const updateRoomType = async (req: Request<{ id: string }, {}, Partial<CreateRoomTypeBody>>, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updates = req.body

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room type ID'
      })
      return
    }

    // Validate numeric fields if provided
    if (updates.maxOccupancy !== undefined && updates.maxOccupancy < 1) {
      res.status(400).json({
        success: false,
        message: 'maxOccupancy must be at least 1'
      })
      return
    }

    if (updates.pricePerNight !== undefined && updates.pricePerNight < 0) {
      res.status(400).json({
        success: false,
        message: 'pricePerNight must be non-negative'
      })
      return
    }

    if (updates.totalQuantity !== undefined && updates.totalQuantity < 1) {
      res.status(400).json({
        success: false,
        message: 'totalQuantity must be at least 1'
      })
      return
    }

    // Check if name is being updated and if it conflicts with existing room type
    if (updates.name) {
      const existingRoomType = await RoomType.findOne({ 
        name: updates.name.trim(),
        _id: { $ne: id }
      })
      
      if (existingRoomType) {
        res.status(400).json({
          success: false,
          message: 'Room type with this name already exists'
        })
        return
      }
    }

    // Trim string fields
    if (updates.name) updates.name = updates.name.trim()
    if (updates.description) updates.description = updates.description.trim()

    const roomType = await RoomType.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    )

    if (!roomType) {
      res.status(404).json({
        success: false,
        message: 'Room type not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Room type updated successfully',
      data: roomType
    })
  } catch (error) {
    console.error('Error updating room type:', error)
    
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

    // Handle duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Room type with this name already exists'
      })
      return
    }

    res.status(500).json({
      success: false,
      message: 'Error updating room type',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Delete a room type
export const deleteRoomType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room type ID'
      })
      return
    }

    // TODO: Check if there are any bookings for this room type
    // For now, we'll allow deletion - in production you might want to prevent deletion
    // if there are future bookings

    const roomType = await RoomType.findByIdAndDelete(id)

    if (!roomType) {
      res.status(404).json({
        success: false,
        message: 'Room type not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Room type deleted successfully',
      data: roomType
    })
  } catch (error) {
    console.error('Error deleting room type:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting room type',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}