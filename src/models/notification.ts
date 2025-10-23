import '@core/declarations'
import { Models } from '@core/constants/database-models'
import { model, Schema } from 'mongoose'

const ObjectId = Schema.Types.ObjectId

interface INotification {
	title: string
	description: string
	readAt: Date
	isDeleted: boolean
	isRead: boolean
	_user?: typeof ObjectId  // Optional for room-based notifications
	_room?: typeof ObjectId  // Optional for room-based notifications
	redirectionUrl?: string
	metaData?: any
}

const schema = new Schema<INotification>({
	title: String,
	description: String,
	_user: { type: ObjectId, ref: Models.User }, // Optional - for user-specific notifications
	_room: { type: ObjectId, ref: Models.Room }, // Optional - for room-based notifications
	readAt: Date,
	isRead: { type: Boolean, default: false },
	isDeleted: { type: Boolean, default: false },
	redirectionUrl: String,
	metaData: { type: Schema.Types.Mixed },
})

export const NotificationModel = model<INotification>(Models.Notification, schema)
