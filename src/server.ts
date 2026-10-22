import { config } from './config'
import app from './app'
import { prisma } from './config/prisma'

async function start() {
  try {
    await prisma.$connect()
    console.log('✓ Database connected')

    app.listen(config.port, () => {
      console.log(`✓ Mantram360 API running on port ${config.port} [${config.env}]`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

start()
