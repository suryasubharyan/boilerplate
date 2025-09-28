import '@core/declarations'
import { Schema, model as Model } from 'mongoose'
import bcrypt from 'bcrypt'
import { Role } from '@core/constants/roles'
import { Models } from '@core/constants/database-models'

const ObjectId = Schema.Types.ObjectId

export enum TwoFactorAuthenticationSettings {
	AuthenticatorApp = 'AuthenticatorApp',
	Phone = 'Phone',
	Email = 'Email',
}

export enum SocialAuthType {
	NONE = 'NONE',
	GOOGLE = 'GOOGLE',
	LINKEDIN = 'LINKEDIN',
}

export interface IUser {
	firstName?: string
	lastName?: string
	parsedFullName?: string
	email?: string
	phone?: string
	countryCode?: string
	password?: string
	accountType?: Role
	country?: string
	socialAuthType?: string
	lastSigninAt?: Date
	accountMetadata?: {
		isBlocked?: boolean
		isBlockedByAdmin?: boolean
		unblocksAt?: Date
		customBlockMessage?: string
		isFirstTimeLogin?: boolean
		isDeleted: boolean
	}
	twoFactorAuthentication: {
		isActivated: boolean
		authenticationType?: TwoFactorAuthenticationSettings
	}
	isActive: boolean
	_updatedBy: typeof ObjectId
	registeredDevices: Array<{ fcmToken: string; deviceType: string }>
}

const schema = new Schema<IUser>(
	{
		firstName: { type: String, sparse: true },
		lastName: { type: String, sparse: true },
		parsedFullName: { type: String, select: false },
		password: { type: String, select: false },
		email: { type: String, sparse: true },
		accountType: {
			type: String,
			enum: [Role.USER, Role.SUPER_ADMIN, Role.ADMIN],
			default: Role.USER,
		},
		lastSigninAt: Date,
		accountMetadata: {
			isBlocked: { type: Boolean, default: false },
			isBlockedByAdmin: { type: Boolean, default: false },
			unblocksAt: Date,
			customBlockMessage: String,
			isFirstTimeLogin: { type: Boolean, default: true },
			isDeleted: { type: Boolean, default: false },
		},
		phone: String,
		countryCode: String,
		socialAuthType: {
			type: String,
			enum: Object.keys(SocialAuthType),
			default: SocialAuthType.NONE,
		},
		registeredDevices: { type: [{ fcmToken: String, deviceType: String }], default: [] },
		twoFactorAuthentication: {
			isActivated: { type: Boolean, default: false },
			authenticationType: {
				type: String,
				enum: Object.keys(TwoFactorAuthenticationSettings),
			},
		},
		// From Base Model
		isActive: { type: Boolean, default: true },
		_updatedBy: { type: ObjectId, ref: Models.User },
	},
	{
		autoIndex: true,
		versionKey: false,
		timestamps: true,
	}
)

// Before Save Hook
schema.pre('save', async function () {
	// Hash password
	const { password } = this

	if (this.isModified('firstName') || this.isModified('lastName')) {
		this.parsedFullName = [this.firstName, this.lastName].filter(Boolean).join(' ')
	}

	// hashing password
	if (this.isModified('password')) {
		const hash = bcrypt.hashSync(password, App.Config.SALT_ROUNDS)
		this.password = hash
	}
})

// Function to check if any document exits with the given id
schema.static('findById', (value, projection = {}) => {
	return App.Models.User.findOne({ _id: value }, projection)
})

// Function to check if any document exits with the given email
schema.static('findByEmail', (email) => {
	return App.Models.User.findOne({ email, isActive: true })
})

// Function to check if any document exits with the given phone
schema.static('findByPhone', (phone, countryCode) => {
	return App.Models.User.findOne({
		countryCode,
		phone,
		isActive: true,
	})
})

export const UserModel = Model<IUser>(Models.User, schema)
