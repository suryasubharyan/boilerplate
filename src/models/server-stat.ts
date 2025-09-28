import { Models } from '@core/constants/database-models'
import { IBaseModel } from '@core/database'
import { Schema, model as Model } from 'mongoose'
const ObjectId = Schema.Types.ObjectId

export const enum MAINTENANCE_MODE_ENUM {
	OFF = 'OFF',
	ON = 'ON',
}

interface IServerStat extends IBaseModel {
	name?: string
	value?: any
}

const schema = new Schema<IServerStat>(
	{
		name: String,
		value: Schema.Types.Mixed,

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

export const ServerStatModel = Model<IServerStat>(Models.ServerStat, schema)
