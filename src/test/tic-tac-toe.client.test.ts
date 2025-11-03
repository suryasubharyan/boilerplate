// import { io } from 'socket.io-client'

// // You may need to update this port if your server runs elsewhere
// const SERVER_URL = 'http://localhost:5000/tic-tac-toe'

// // Create two socket clients (simulate 2 players)
// const socket1 = io(SERVER_URL, { transports: ['websocket'] })
// const socket2 = io(SERVER_URL, { transports: ['websocket'] })

// const roomId = 'room1234'

// socket1.on('connect', () => {
//   console.log('✅ Player 1 connected:', socket1.id)
//   socket1.emit('create-room', roomId)
// })

// socket1.on('room-created', (data) => {
//   console.log('🟢 Room created:', data)
// })

// socket2.on('connect', () => {
//   console.log('✅ Player 2 connected:', socket2.id)
//   // Wait 1 second then join the same room
//   setTimeout(() => {
//     console.log('🎮 Player 2 joining room...')
//     socket2.emit('join-room', roomId)
//   }, 1000)
// })

// // Listen for room status on both clients
// socket1.on('room-status', (data) => {
//   console.log('📊 Player1 room-status:', data)
// })
// socket2.on('room-status', (data) => {
//   console.log('📊 Player2 room-status:', data)
//   // Try making a move as Player2 if it's their turn
//   if (data.currentTurn === socket2.id) {
//     console.log('🎯 Player2 making move at index 0')
//     socket2.emit('make-move', { roomId, index: 0 })
//   }
// })

// // Listen for board updates and game-over
// socket1.on('update-board', (data) => console.log('♻️ Player1 board update:', data))
// socket2.on('update-board', (data) => console.log('♻️ Player2 board update:', data))

// socket1.on('game-over', (data) => console.log('🏁 Game Over (P1):', data))
// socket2.on('game-over', (data) => console.log('🏁 Game Over (P2):', data))

// // Error handling
// socket1.on('connect_error', (err) => console.error('P1 connect_error:', err.message))
// socket2.on('connect_error', (err) => console.error('P2 connect_error:', err.message))

// // Cleanup
// setTimeout(() => {
//   socket1.disconnect()
//   socket2.disconnect()
//   console.log('🔌 Test finished.')
// }, 10000)
