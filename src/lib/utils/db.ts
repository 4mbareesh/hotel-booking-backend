import mongoose from 'mongoose'

const connectToDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.DATABASE_URI!)
    console.log('MongoDB Connected!')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectToDB
