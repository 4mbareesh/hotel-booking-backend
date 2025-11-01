import mongoose, { Schema, Document } from 'mongoose'

export interface IBooking extends Document {
  roomTypeId: mongoose.Types.ObjectId
  roomTypeName: string
  customerName: string
  customerPhone: string
  checkInDate: Date
  checkOutDate: Date
  numberOfGuests: number
  pricePerNight: number
  totalPrice: number
  bookingDate: Date
  status: 'confirmed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const BookingSchema: Schema = new Schema(
  {
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type ID is required']
    },
    roomTypeName: {
      type: String,
      required: [true, 'Room type name is required'],
      trim: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^\+?[\d\s\-\(\)]{10,}$/.test(v)
        },
        message: 'Please enter a valid phone number'
      }
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required']
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required']
    },
    numberOfGuests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Number of guests must be at least 1']
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price per night must be positive']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price must be positive']
    },
    bookingDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed'
    }
  },
  {
    timestamps: true
  }
)

// Add indexes for better query performance
BookingSchema.index({ roomTypeId: 1 })
BookingSchema.index({ checkInDate: 1, checkOutDate: 1 })
BookingSchema.index({ status: 1 })
BookingSchema.index({ customerPhone: 1 })

// Validate that check-out date is after check-in date
BookingSchema.pre('save', function(next) {
  const checkInDate = this.get('checkInDate') as Date
  const checkOutDate = this.get('checkOutDate') as Date
  if (checkOutDate <= checkInDate) {
    next(new Error('Check-out date must be after check-in date'))
  }
  next()
})

export default mongoose.model<IBooking>('Booking', BookingSchema)