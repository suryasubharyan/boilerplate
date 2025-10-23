import '@core/declarations'
import Paginator from '@helpers/pagination.helper'
import regexQueryGeneratorHelper from '@helpers/regex-query-generator.helper'

class NotificationServices {
	model: any
	constructor() {
		this.model = App.Models.Notification
	}

	GetAll = async (payload, _user: string) => {
		const { itemsPerPage, startIndex, type } = payload
		
		// Build query for both user-specific and room-based notifications
		const searchFields = _.omitBy(
			{
				$or: [
					{ _user }, // User-specific notifications
					{ 
						_room: { $exists: true }, // Room-based notifications
						'metaData.affectedUserIds': _user // User is affected by this room notification
					}
				],
				isDeleted: false,
			},
			_.isNil
		)

		if (payload.type === 'unread') {
			searchFields.isRead = false
		}
		
		const query = await regexQueryGeneratorHelper.Generate({
			searchFields,
			excludeRegex: ['_user', '_room', 'isRead', 'isDeleted', 'metaData.affectedUserIds'],
		})
		
		const paginationOptions = {
			model: this.model,
			query,
			projection: {
				title: 1,
				description: 1,
				isRead: 1,
				createdAt: 1,
				readAt: 1,
				metaData: 1,
				_user: 1,
				_room: 1,
				redirectionUrl: 1,
			},
			startIndex: Number(startIndex) || 1,
			itemsPerPage: Number(itemsPerPage) || 10,
		}
		const result = await Paginator.Paginate(paginationOptions)

		return result
	}

	UnreadCount = async (_user) => {
		const filterQuery = {
			$or: [
				{ _user, isDeleted: false, isRead: false }, // User-specific notifications
				{ 
					_room: { $exists: true }, // Room-based notifications
					'metaData.affectedUserIds': _user, // User is affected by this room notification
					isDeleted: false,
					isRead: false
				}
			]
		}
		const data = await this.model.countDocuments(filterQuery)
		return data.toString()
	}

	MarkasRead = async (payload, _user: string) => {
		const { isMarkAll = false, _notification } = payload
		let data = null
		if (isMarkAll) {
			// Mark all notifications as read for this user (both user-specific and room-based)
			data = await this.model.updateMany(
				{
					$or: [
						{ _user, isDeleted: false }, // User-specific notifications
						{ 
							_room: { $exists: true }, // Room-based notifications
							'metaData.affectedUserIds': _user,
							isDeleted: false
						}
					]
				},
				{ isRead: true, readAt: Date.now() }
			)
		} else {
			// Mark specific notification as read
			data = await this.model.findOneAndUpdate(
				{ 
					_id: _notification, 
					isDeleted: false,
					$or: [
						{ _user }, // User-specific notification
						{ 
							_room: { $exists: true }, // Room-based notification
							'metaData.affectedUserIds': _user
						}
					]
				},
				{ isRead: true, readAt: Date.now() },
				{ new: true }
			)
		}
		return data
	}

	FetchAll = async (payload, _user: string) => {
		try {
			const data = await this.GetAll(payload, _user)
			const unreadCounts = await this.UnreadCount(_user)
			return { data: { message: 'Success.', unreadCounts, ...data } }
		} catch (error) {
			Logger.error(error)
			throw error
		}
	}

	RemoveNotification = async (payload, _user: string) => {
		try {
			const { _notification, isRemoveAll = false } = payload

			let data = null
			if (isRemoveAll) {
				// Remove all notifications for this user (both user-specific and room-based)
				data = await this.model.updateMany(
					{
						$or: [
							{ _user, isDeleted: false }, // User-specific notifications
							{ 
								_room: { $exists: true }, // Room-based notifications
								'metaData.affectedUserIds': _user,
								isDeleted: false
							}
						]
					},
					{ $set: { isDeleted: true } }
				)
			} else {
				// Remove specific notification
				data = await this.model.findOneAndUpdate(
					{ 
						_id: _notification, 
						isDeleted: false,
						$or: [
							{ _user }, // User-specific notification
							{ 
								_room: { $exists: true }, // Room-based notification
								'metaData.affectedUserIds': _user
							}
						]
					},
					{ $set: { isDeleted: true } },
					{ new: true }
				)
			}

			return data
		} catch (error) {
			Logger.error(error)
			throw error
		}
	}
}

export const NotificationService = new NotificationServices()
