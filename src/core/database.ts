import '@core/declarations'
import mongoose, { connect, Schema } from 'mongoose'
const ObjectId = Schema.Types.ObjectId

mongoose.set('strictQuery', true)

export interface IBaseModel {
	isActive: boolean
	createdAt?: Date
	updatedAt?: Date
	_createdBy?: typeof ObjectId
	_updatedBy?: typeof ObjectId
}

export class Database {
	private url: string
	private connectionOptions: Record<string, unknown>

	constructor(options: { url: string; connectionOptions?: Record<string, unknown> }) {
		const {
			url = 'mongodb://localhost:27017/test',
			connectionOptions = {
				// useNewUrlParser: true,
				// useUnifiedTopology: true,
			},
		} = options

		this.url = url
		this.connectionOptions = connectionOptions
	}

	async connect(): Promise<void> {
		await connect(this.url.toString(), this.connectionOptions)
		Logger.info('Database Connected Successfully.')
	}
}
