import '@core/declarations'
import { Schema, model as Model } from 'mongoose'
import { Models } from '@core/constants/database-models'
import { IBaseModel } from '@core/database'

const ObjectId = Schema.Types.ObjectId

export interface IUserProfile extends IBaseModel {
	_user: typeof ObjectId
	_designation?: typeof ObjectId
	location?: {
		area?: string
		city?: string
		state?: string
		country?: string
	}
}

const schema = new Schema<IUserProfile>(
	{
		_user: { type: ObjectId, ref: Models.User, required: true },
		_designation: { type: ObjectId, ref: 'designations' },
		location: {
			area: String,
			city: String,
			state: String,
			country: String,
		},

		// From Base Model
		isActive: { type: Boolean, default: true },
		_createdBy: { type: ObjectId, ref: Models.User },
		_updatedBy: { type: ObjectId, ref: Models.User },
	},
	{
		autoIndex: true,
		versionKey: false,
		timestamps: true,
	}
)

export const UserProfileModel = Model<IUserProfile>(Models.UserProfile, schema)

