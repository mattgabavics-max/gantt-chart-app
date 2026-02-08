import express from 'express'
import dotenv from 'dotenv'
import corsMiddleware from './middleware/cors.js'
import routes from './routes/index.js'
import authRoutes from './routes/auth.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { connectDatabase } from './config/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(corsMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running successfully!',
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api', routes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Connect to database and start server
async function startServer() {
  try {
    await connectDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
      console.log(`📊 API available at http://localhost:${PORT}/api`)
      console.log(`🔐 Auth endpoints at http://localhost:${PORT}/api/auth`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
