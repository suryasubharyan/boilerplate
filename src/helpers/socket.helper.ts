import '@core/declarations'
import authenticateSocket from '@middlewares/socket'
import { NotificationService } from '@modules/notification/services'
import { Server } from 'socket.io'
import requestValidator from './request-validator.helper'
import { MarkAsReadDTO } from '@modules/notification/dtos/mark-as-read.dto'
import { RemoveNotiDTO } from '@modules/notification/dtos/remove.dto'
import { GetAllDTO } from '@modules/notification/dtos/get-all'

enum SocketEvents {
	//Listeners
	NotificationList = 'notification_list',
	Error = 'error',
	
	// Room Events
	JoinRoom = 'join_room',
	LeaveRoom = 'leave_room',
	RoomMessage = 'room_message',
	RoomTyping = 'room_typing',
	RoomTypingStop = 'room_typing_stop',
	RoomInvite = 'room_invite',
	RoomMemberJoined = 'room_member_joined',
	RoomMemberLeft = 'room_member_left',
	RoomUpdated = 'room_updated',

	//Emitters
	Connection = 'connection',
	MarkasRead = 'mark_as_read',
	MarkAllAsRead = 'mark_all_as_read',
	Remove = 'delete',
	RemoveAll = 'delete_all',
	Disconnect = 'disconnect',
	Join = 'join',
}

interface ISocketNotiReqObj {
	startIndex?: number
	itemsPerPage?: number
	isMarkAll?: boolean
	_notification?: string
	isRemoveAll?: boolean
}

interface IRoomSocketPayload {
	roomId: string
	message?: string
	userId?: string
}

export default async function initializeSocket(server) {
	try {
		const io = new Server(server, {
			cors: {
				origin: '*',
			},
			// path: App.Config.SOCKET_PATH
		})
		io.use(authenticateSocket)
		io.on(SocketEvents.Connection, async (socket: any) => {
			Logger.info(`User Connected | ${socket.id}`)
			const socketUser = socket.id

			// JOIN USER
			socket.on(SocketEvents.Join, async (payload: ISocketNotiReqObj) => {
				try {
					socket.join(socketUser)
					const notificationList = await NotificationService.FetchAll(payload, socketUser)
					return io.to(socketUser).emit(SocketEvents.NotificationList, notificationList)
				} catch (error) {
					Logger.error(error)
					throw error
				}
			})

			// JOIN ROOM
			socket.on(SocketEvents.JoinRoom, async (payload: IRoomSocketPayload) => {
				try {
					const { roomId } = payload
					if (!roomId) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room ID is required.', statusCode: 400 }
						})
					}

					const room = await App.Models.Room.findById(roomId)
					if (!room) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room not found.', statusCode: 404 }
						})
					}

					if (!room.isMember(socketUser)) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'You are not a member of this room.', statusCode: 403 }
						})
					}

					socket.join(roomId)
					socket.emit('room_joined', { roomId, message: 'Successfully joined room' })
					
					// Notify other room members
					socket.to(roomId).emit(SocketEvents.RoomMemberJoined, {
						roomId,
						userId: socketUser,
						message: 'User joined the room'
					})

					Logger.info(`User ${socketUser} joined room ${roomId}`)
				} catch (error) {
					Logger.error(error)
					socket.emit(SocketEvents.Error, {
						error: { message: 'Failed to join room.', statusCode: 500 }
					})
				}
			})

			// LEAVE ROOM
			socket.on(SocketEvents.LeaveRoom, async (payload: IRoomSocketPayload) => {
				try {
					const { roomId } = payload
					if (!roomId) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room ID is required.', statusCode: 400 }
						})
					}

					socket.leave(roomId)
					socket.emit('room_left', { roomId, message: 'Successfully left room' })
					
					// Notify other room members
					socket.to(roomId).emit(SocketEvents.RoomMemberLeft, {
						roomId,
						userId: socketUser,
						message: 'User left the room'
					})

					Logger.info(`User ${socketUser} left room ${roomId}`)
				} catch (error) {
					Logger.error(error)
					socket.emit(SocketEvents.Error, {
						error: { message: 'Failed to leave room.', statusCode: 500 }
					})
				}
			})

			// ROOM MESSAGE
			socket.on(SocketEvents.RoomMessage, async (payload: IRoomSocketPayload) => {
				try {
					const { roomId, message } = payload
					if (!roomId || !message) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room ID and message are required.', statusCode: 400 }
						})
					}

					const room = await App.Models.Room.findById(roomId)
					if (!room) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room not found.', statusCode: 404 }
						})
					}

					if (!room.isMember(socketUser)) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'You are not a member of this room.', statusCode: 403 }
						})
					}

					// Update room metadata
					room.metadata.lastMessageAt = new Date()
					room.metadata.lastMessageBy = socketUser
					room.metadata.messageCount = (room.metadata.messageCount || 0) + 1
					await room.save()

					// Broadcast message to all room members
					io.to(roomId).emit('room_message_received', {
						roomId,
						userId: socketUser,
						message,
						timestamp: new Date(),
						messageId: new Date().getTime().toString() // Simple message ID
					})

					Logger.info(`Message sent in room ${roomId} by user ${socketUser}`)
				} catch (error) {
					Logger.error(error)
					socket.emit(SocketEvents.Error, {
						error: { message: 'Failed to send message.', statusCode: 500 }
					})
				}
			})

			// ROOM TYPING
			socket.on(SocketEvents.RoomTyping, async (payload: IRoomSocketPayload) => {
				try {
					const { roomId } = payload
					if (!roomId) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room ID is required.', statusCode: 400 }
						})
					}

					const room = await App.Models.Room.findById(roomId)
					if (!room || !room.isMember(socketUser)) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room not found or access denied.', statusCode: 404 }
						})
					}

					// Broadcast typing indicator to other room members
					socket.to(roomId).emit('room_typing', {
						roomId,
						userId: socketUser,
						isTyping: true
					})
				} catch (error) {
					Logger.error(error)
					socket.emit(SocketEvents.Error, {
						error: { message: 'Failed to send typing indicator.', statusCode: 500 }
					})
				}
			})

			// ROOM TYPING STOP
			socket.on(SocketEvents.RoomTypingStop, async (payload: IRoomSocketPayload) => {
				try {
					const { roomId } = payload
					if (!roomId) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room ID is required.', statusCode: 400 }
						})
					}

					const room = await App.Models.Room.findById(roomId)
					if (!room || !room.isMember(socketUser)) {
						return socket.emit(SocketEvents.Error, {
							error: { message: 'Room not found or access denied.', statusCode: 404 }
						})
					}

					// Broadcast typing stop indicator to other room members
					socket.to(roomId).emit('room_typing_stop', {
						roomId,
						userId: socketUser,
						isTyping: false
					})
				} catch (error) {
					Logger.error(error)
					socket.emit(SocketEvents.Error, {
						error: { message: 'Failed to send typing stop indicator.', statusCode: 500 }
					})
				}
			})

			// GET NOTIFICATION LIST
			socket.on(SocketEvents.NotificationList, async (payload: ISocketNotiReqObj) => {
				try {
					const errors = await requestValidator(GetAllDTO, payload)
					if (errors) {
						return io.to(socketUser).emit(SocketEvents.Error, {
							error: {
								message: errors.details[0].message.replace(/"/g, '') + '.',
								statusCode: 422,
							},
						})
					}
					const notificationList = await NotificationService.FetchAll(payload, socketUser)
					return io.to(socketUser).emit(SocketEvents.NotificationList, notificationList)
				} catch (error) {
					Logger.error(error)
					throw error
				}
			})

			// MARK AS READ
			socket.on(SocketEvents.MarkasRead, async (payload: ISocketNotiReqObj) => {
				try {
					const errors = await requestValidator(MarkAsReadDTO, payload)
					if (errors) {
						return io.to(socketUser).emit(SocketEvents.Error, {
							error: {
								message: errors.details[0].message.replace(/"/g, '') + '.',
								statusCode: 422,
							},
						})
					}
					await NotificationService.MarkasRead(payload, socketUser)
					const notificationList = await NotificationService.FetchAll(payload, socketUser)
					return io.to(socketUser).emit(SocketEvents.NotificationList, notificationList)
				} catch (error) {
					Logger.error(error)
					throw error
				}
			})

			// MARK ALL AS READ
			socket.on(SocketEvents.MarkAllAsRead, async (payload: ISocketNotiReqObj) => {
				try {
					const errors = await requestValidator(MarkAsReadDTO, payload)
					if (errors) {
						return io.to(socketUser).emit(SocketEvents.Error, {
							error: {
								message: errors.details[0].message.replace(/"/g, '') + '.',
								statusCode: 422,
							},
						})
					}
					await NotificationService.MarkasRead(payload, socketUser)
					const notificationList = await NotificationService.FetchAll(payload, socketUser)
					return io
						.to(socketUser._id)
						.emit(SocketEvents.NotificationList, notificationList)
				} catch (error) {
					Logger.error(error)
					throw error
				}
			})

			// DELETE NOTIFICATION
			socket.on(SocketEvents.Remove, async (payload: ISocketNotiReqObj) => {
				try {
					const errors = await requestValidator(RemoveNotiDTO, payload)
					if (errors) {
						return {
							error: {
								message: errors.details[0].message.replace(/"/g, '') + '.',
								statusCode: 422,
							},
						}
					}
					await NotificationService.MarkasRead(payload, socketUser)
					const notificationList = await NotificationService.FetchAll(payload, socketUser)
					return io
						.to(socketUser._id)
						.emit(SocketEvents.NotificationList, notificationList)
				} catch (error) {
					Logger.error(error)
					throw error
				}
			})

			// DELETE ALL NOTIFICATION
			socket.on(SocketEvents.RemoveAll, async (payload: ISocketNotiReqObj) => {
				try {
					const errors = await requestValidator(RemoveNotiDTO, payload)
					if (errors) {
						return {
							error: {
								message: errors.details[0].message.replace(/"/g, '') + '.',
								statusCode: 422,
							},
						}
					}
					await NotificationService.MarkasRead(payload, socketUser)
					const notificationList = await NotificationService.FetchAll(payload, socketUser)
					return io
						.to(socketUser._id)
						.emit(SocketEvents.NotificationList, notificationList)
				} catch (error) {
					Logger.error(error)
					throw error
				}
			})

			// DISCONNECT USER
			socket.on(SocketEvents.Disconnect, () => {
				Logger.warn(`User Disconnected | ${socketUser}`)
			})
		})
	} catch (error) {
		Logger.error(error)
		throw error
	}
}