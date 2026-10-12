import { createServer } from 'vite'

process.env.VITE_API_BASE_URL = process.env.OLS_TEAM_API_URL ?? 'https://serotonin-bonehead-viscous.ngrok-free.dev/api/v1'
const server = await createServer()
await server.listen()
server.printUrls()
