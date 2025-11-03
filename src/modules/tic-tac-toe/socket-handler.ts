import { Server, Socket } from 'socket.io'
import JWTHelper from '@helpers/jwt.helper'

interface Player {
  socketId: string
  userId: string
  symbol: 'X' | 'O'
}

interface Room {
  id: string
  players: Player[]
  board: string[]
  currentTurn: string | null
}

const rooms: Record<string, Room> = {}

export default function registerTicTacToe(io: Server) {
  const namespace = io.of('/tic-tac-toe')

  // ✅ Socket authentication middleware
  namespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Unauthorized'))

      const decoded: any = JWTHelper.VerifyToken(token)
      socket.data.userId = decoded.email || decoded._id || 'unknown'
      socket.data.email = decoded.email || 'unknown'

      next()
    } catch (err: any) {
      console.error('❌ Socket Auth Error:', err.message)
      next(new Error('Unauthorized'))
    }
  })

  namespace.on('connection', (socket: Socket) => {
    console.log('🎮 User connected:', socket.data.email, `[${socket.id}]`)

    // ✅ Create Room
    socket.on('create-room', (roomId: string) => {
      if (rooms[roomId]) {
        socket.emit('error', { message: 'Room already exists' })
        return
      }

      rooms[roomId] = {
        id: roomId,
        players: [
          {
            socketId: socket.id,
            userId: socket.data.email,
            symbol: 'X',
          },
        ],
        board: Array(9).fill(''),
        currentTurn: socket.id,
      }

      socket.join(roomId)
      socket.emit('room-created', { roomId })
      console.log('🏠 Room created:', roomId)
    })

    // ✅ Join Room (fixed)
    socket.on('join-room', (roomId: string) => {
      try {
        if (!roomId) {
          socket.emit('error_message', 'Room ID required.')
          return
        }

        if (!rooms[roomId]) {
          socket.emit('error', { message: 'Room not found' })
          return
        }

        const room = rooms[roomId]
        const userEmail = socket.data.email

        // ✅ Prevent same user from joining again
        const alreadyJoined = room.players.some((p) => p.userId === userEmail)
        if (alreadyJoined) {
          console.log(`⚠️ ${userEmail} already in room ${roomId}`)
          socket.emit('info_message', 'You are already in this room.')
          return
        }

        if (room.players.length >= 2) {
          socket.emit('error_message', 'Room full')
          return
        }

        // Assign symbol based on order
        const symbol = room.players.length === 0 ? 'X' : 'O'
        room.players.push({
          socketId: socket.id,
          userId: userEmail,
          symbol,
        })

        socket.join(roomId)
        console.log(`👥 Player joined: ${userEmail} -> ${roomId}`)

        namespace.to(roomId).emit('room-status', room)
      } catch (err) {
        console.error('Join room error:', err)
      }
    })

    // ✅ Handle move
    socket.on('make-move', ({ roomId, index }) => {
      const room = rooms[roomId]
      if (!room) return
      if (room.board[index] !== '') return
      if (room.currentTurn !== socket.id) return

      const player = room.players.find((p) => p.socketId === socket.id)
      if (!player) return

      room.board[index] = player.symbol

      const winner = checkWinner(room.board)
      if (winner || !room.board.includes('')) {
        namespace.to(roomId).emit('game-over', {
          winner: winner || 'draw',
          board: room.board,
        })
        return
      }

      // Alternate turn
      room.currentTurn =
        room.currentTurn === room.players[0].socketId
          ? room.players[1].socketId
          : room.players[0].socketId

      namespace.to(roomId).emit('update-board', {
        board: room.board,
        currentTurn: room.currentTurn,
      })
    })

    // ✅ Reset Room
    socket.on('reset-room', (roomId: string) => {
      const room = rooms[roomId]
      if (!room) return

      room.board = Array(9).fill('')
      room.currentTurn = room.players[0]?.socketId || null

      namespace.to(roomId).emit('room-reset', room)
    })

    // ✅ Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.data.email)
      for (const id in rooms) {
        const room = rooms[id]
        if (!room) continue

        const idx = room.players.findIndex((p) => p.socketId === socket.id)
        if (idx !== -1) {
          room.players.splice(idx, 1)
          namespace.to(id).emit('player-left', {
            message: 'Player left the game',
            players: room.players,
          })
          if (room.players.length === 0) delete rooms[id]
        }
      }
    })
  })
}

// ✅ Helper to check winner
function checkWinner(board: string[]) {
  const combos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  for (let [a, b, c] of combos) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}
