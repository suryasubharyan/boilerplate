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
		const searchFields = _.omitBy(
			{
				_user,
				isDeleted: false,
			},
			_.isNil
		)

		if (payload.type === 'unread') {
			searchFields.isRead = false
		}
		const query = await regexQueryGeneratorHelper.Generate({
			searchFields,
			excludeRegex: ['_user', 'isRead', 'isDeleted'],
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
				metadata: 1,
			},
			startIndex: Number(startIndex) || 1,
			itemsPerPage: Number(itemsPerPage) || 10,
		}
		const result = await Paginator.Paginate(paginationOptions)

		return result
	}

	UnreadCount = async (_user) => {
		const filterQuery: { isDeleted: boolean; isRead: boolean; _user: string } = {
			_user,
			isDeleted: false,
			isRead: false,
		}
		const data = await this.model.countDocuments(filterQuery)
		return data.toString()
	}

	MarkasRead = async (payload, _user: string) => {
		const { isMarkAll = false, _notification } = payload
		let data = null
		if (isMarkAll) {
			data = await this.model.updateMany(
				{ _user, isDeleted: false },
				{ isRead: true, readAt: Date.now() }
				// { new: true }
			)
		} else {
			data = await this.model.findOneAndUpdate(
				{ _id: _notification, isDeleted: false },
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
				data = await this.model.updateMany(
					{ _user, isDeleted: false },
					{ $set: { isDeleted: true } }
					// { new: true }
				)
			} else {
				data = await this.model.findOneAndUpdate(
					{ _id: _notification, isDeleted: false },
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
