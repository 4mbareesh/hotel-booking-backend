import mongoose, { Schema, Document } from 'mongoose'

export interface IRoomType extends Document {
  name: string
  description: string
  maxOccupancy: number
  pricePerNight: number
  totalQuantity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const RoomTypeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: [true, 'Room description is required'],
      trim: true
    },
    maxOccupancy: {
      type: Number,
      required: [true, 'Maximum occupancy is required'],
      min: [1, 'Maximum occupancy must be at least 1']
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price per night must be positive']
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Total quantity must be at least 1']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Add indexes for better query performance
// Note: name field already has unique index from schema definition
RoomTypeSchema.index({ maxOccupancy: 1 })
RoomTypeSchema.index({ pricePerNight: 1 })

export default mongoose.model<IRoomType>('RoomType', RoomTypeSchema)
