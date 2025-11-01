import { Router } from 'express'
import type { Request, Response } from 'express'
import roomRoutes from './room'

const router = Router()

router.get('/api', (_req: Request, res: Response) => {
  res.sendStatus(200)
})

router.use('/api/rooms', roomRoutes)

router.use('/', (_req: Request, res: Response) => {
  res.sendStatus(404)
})

export default router
