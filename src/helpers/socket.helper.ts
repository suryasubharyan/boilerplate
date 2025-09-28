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
