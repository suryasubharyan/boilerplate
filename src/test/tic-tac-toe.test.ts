// import { createServer } from 'http'
// import express from 'express'
// import { Server } from 'socket.io'
// import jwt from 'jsonwebtoken'
// import { initializeTicTacToe } from '@modules/tic-tac-toe/socket-handler'

// const app = express()
// const httpServer = createServer(app)
// const io = new Server(httpServer, {
//   cors: {
//     origin: '*',
//   },
// })

// // ✅ Initialize Tic-Tac-Toe namespace
// initializeTicTacToe(io)

// httpServer.listen(6001, () => {
//   console.log('🧩 Test TicTacToe server running on port 6001')
//   console.log('➡ Use socket.io client to test at ws://localhost:6001/tic-tac-toe')
// })
