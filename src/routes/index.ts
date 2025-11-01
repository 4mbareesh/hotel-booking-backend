import { Router } from 'express'
import type { Request, Response, Router as ExpressRouter } from 'express'
import roomtypeRoutes from './room-type'
import searchRoutes from './search'
import bookingRoutes from './booking'
import bookingsRoutes from './bookings'

const router: ExpressRouter = Router()

router.get('/api', (_req: Request, res: Response) => {
  res.sendStatus(200)
})

router.use('/api/rooms', roomtypeRoutes)
router.use('/api/search', searchRoutes)
router.use('/api/book', bookingRoutes)        // POST /api/book
router.use('/api/bookings', bookingsRoutes)   // GET/PUT /api/bookings/*

router.use('/', (_req: Request, res: Response) => {
  res.sendStatus(404)
})

export default router
