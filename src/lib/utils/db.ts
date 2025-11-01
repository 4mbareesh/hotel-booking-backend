import mongoose from 'mongoose'

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI!)
    console.log('MongoDB Connected!')
  } catch (error) {
    console.log(error)
    return null
  }
}

export default connectToDB
