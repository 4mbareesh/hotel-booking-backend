import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import routes from './routes'
import connectToDB from './lib/utils/db'
import { CORS_OPTIONS } from './lib/constants'

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(morgan('dev'))
app.use(cors(CORS_OPTIONS))
connectToDB()
app.use(routes)

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
})
