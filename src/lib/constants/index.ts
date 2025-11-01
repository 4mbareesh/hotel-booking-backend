
export const CORS_OPTIONS = {
  origin: [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    process.env.CLIENT_URL!,
    process.env.SERVER_URL!,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
