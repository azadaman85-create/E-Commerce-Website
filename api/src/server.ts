import cors from 'cors'
import express from 'express'
import { prisma } from './db.js'
import { adminRouter } from './routes/admin.js'
import { shopRouter } from './routes/shop.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

// The storefront calls this server-side, the admin panel from the browser.
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', async (_req, res) => {
  const products = await prisma.product.count()
  res.json({ status: 'ok', products })
})

app.use('/api', shopRouter)
app.use('/api/admin', adminRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)
  res.status(500).json({ error: error.message })
})

app.listen(port, () => {
  console.log(`MI TRENDS API listening on http://localhost:${port}`)
})
