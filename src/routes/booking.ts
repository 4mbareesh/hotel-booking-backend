import { Router, type Router as ExpressRouter } from "express";
import { createBooking } from "../controllers/booking";

const router: ExpressRouter = Router();

// Routes for /api/book
// POST /api/book - Create a new booking (main booking endpoint from project guide)
router.post("/", createBooking);

export default router;
