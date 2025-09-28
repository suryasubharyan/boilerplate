import { Models } from '@core/constants/database-models'
import { IBaseModel } from '@core/database'
import { Schema, model as Model } from 'mongoose'
const ObjectId = Schema.Types.ObjectId

export enum CodeVerificationVia {
	code = 'code',
	link = 'link',
}

export enum CodeVerificationPurpose {
	PRE_SIGNUP = 'PRE_SIGNUP',
	FORGOT_PASSWORD = 'FORGOT_PASSWORD',
	USER_PHONE_UPDATE = 'USER_PHONE_UPDATE',
	SIGNIN_2FA = 'SIGNIN_2FA',
	UPDATE_2FA_SETTING_TO_EMAIL = 'UPDATE_2FA_SETTING_TO_EMAIL',
	UPDATE_2FA_SETTING_TO_PHONE = 'UPDATE_2FA_SETTING_TO_PHONE',
	FORGOT_2FA = 'FORGOT_2FA',
}

export enum CodeVerificationStatus {
	Pending = 'Pending',
	Passed = 'Passed',
	Failed = 'Failed',
}

interface ICodeVerification extends IBaseModel {
	_user?: typeof ObjectId
	phone?: string
	countryCode?: string
	email?: string
	status?: CodeVerificationStatus
	verificationPerformedAt?: Date
	purpose?: CodeVerificationPurpose
	internalOTP?: {
		code: string
		maxRetryAttempt: number
		usedRetryAttempt: number
		expiresAt: Date
	}
	verificationLinkToken: string
	resendDuration: number
}

const schema = new Schema<ICodeVerification>(
	{
		_user: { type: ObjectId },
		phone: String,
		countryCode: String,
		email: String,
		status: {
			type: String,
			enum: [
				CodeVerificationStatus.Pending,
				CodeVerificationStatus.Passed,
				CodeVerificationStatus.Failed,
			],
			default: CodeVerificationStatus.Pending,
		},
		verificationPerformedAt: Date,
		purpose: {
			type: String,
			enum: Object.keys(CodeVerificationPurpose),
		},
		internalOTP: {
			type: {
				code: String,
				maxRetryAttempt: { type: Number, default: 5 },
				usedRetryAttempt: { type: Number, default: 0 },
				expiresAt: Date,
			},
			select: false,
		},
		verificationLinkToken: {
			type: String,
			select: false,
		},
		resendDuration: {
			type: Number,
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

export const CodeVerificationModel = Model<ICodeVerification>(Models.CodeVerification, schema)
