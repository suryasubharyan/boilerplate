import '@core/declarations'
import { Logger } from '@core/logger'

export enum NotificationType {
	ROOM_MEMBER_JOINED = 'room_member_joined',
	ROOM_MEMBER_LEFT = 'room_member_left', 
	ROOM_MEMBER_DISCONNECTED = 'room_member_disconnected',
	ROOM_MESSAGE = 'room_message',
	ROOM_INVITATION = 'room_invitation',
	AUTH_PASSWORD_RESET = 'auth_password_reset',
	AUTH_LOGIN_NEW_DEVICE = 'auth_login_new_device',
	AUTH_ACCOUNT_LOCKED = 'auth_account_locked',
	SYSTEM_MAINTENANCE = 'system_maintenance',
}

export interface CreateNotificationParams {
	userId: string
	type: NotificationType
	title: string
	description: string
	redirectionUrl?: string
	metadata?: any
}

class NotificationHelperService {
	/**
	 * Create a notification record in the database
	 */
	async createNotification(params: CreateNotificationParams) {
		try {
			const notification = new App.Models.Notification({
				_user: params.userId,
				title: params.title,
				description: params.description,
				redirectionUrl: params.redirectionUrl,
				metaData: {
					type: params.type,
					...params.metadata,
				},
				isRead: false,
				isDeleted: false,
			})

			await notification.save()
			Logger.info(`Notification created for user ${params.userId}: ${params.type}`)
			return notification
		} catch (error) {
			Logger.error(`Failed to create notification: ${error.message}`)
			throw error
		}
	}

	/**
	 * Create notifications for multiple users
	 */
	async createBulkNotifications(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>) {
		try {
			const notifications = userIds.map(userId => ({
				_user: userId,
				title: params.title,
				description: params.description,
				redirectionUrl: params.redirectionUrl,
				metaData: {
					type: params.type,
					...params.metadata,
				},
				isRead: false,
				isDeleted: false,
			}))

			const created = await App.Models.Notification.insertMany(notifications)
			Logger.info(`Bulk notifications created for ${userIds.length} users: ${params.type}`)
			return created
		} catch (error) {
			Logger.error(`Failed to create bulk notifications: ${error.message}`)
			throw error
		}
	}

	/**
	 * Create room-wise notifications (one notification per room, not per user)
	 */
	async createRoomNotification(
		roomId: string,
		excludeUserId: string,
		type: NotificationType,
		title: string,
		description: string,
		metadata?: any
	) {
		try {
			// Get room details
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				throw new Error(`Room ${roomId} not found`)
			}

			// Get all room members except the one who triggered the event
			const memberUserIds = room.members
				.filter(member => member.userId.toString() !== excludeUserId && member.isActive)
				.map(member => member.userId.toString())

			if (memberUserIds.length === 0) {
				Logger.info(`No other members to notify for room ${roomId}`)
				return []
			}

			// Create ONE notification record for the room
			const roomNotification = new App.Models.Notification({
				_room: roomId, // Link to room instead of individual users
				title,
				description,
				redirectionUrl: `/rooms/${roomId}`,
				metaData: {
					type,
					roomId,
					roomName: room.name,
					affectedUserIds: memberUserIds, // Track which users should see this
					excludeUserId, // Who triggered the event
					...metadata,
				},
				isRead: false,
				isDeleted: false,
			})

			await roomNotification.save()
			Logger.info(`Room notification created for room ${roomId}: ${type}`)
			return roomNotification
		} catch (error) {
			Logger.error(`Failed to create room notification: ${error.message}`)
			throw error
		}
	}

	/**
	 * Create auth-related notifications
	 */
	async createAuthNotification(
		userId: string,
		type: NotificationType,
		title: string,
		description: string,
		metadata?: any
	) {
		return await this.createNotification({
			userId,
			type,
			title,
			description,
			redirectionUrl: '/profile',
			metadata,
		})
	}

	/**
	 * Create system-wide notifications
	 */
	async createSystemNotification(
		userIds: string[],
		type: NotificationType,
		title: string,
		description: string,
		metadata?: any
	) {
		return await this.createBulkNotifications(userIds, {
			type,
			title,
			description,
			redirectionUrl: '/dashboard',
			metadata,
		})
	}
}

export const NotificationHelper = new NotificationHelperService()
