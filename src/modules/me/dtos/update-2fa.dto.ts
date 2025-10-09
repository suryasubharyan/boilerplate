import Joi from 'joi'
import { TwoFactorAuthenticationSettings } from '@models/user.model'

export const Enable2FADTO = Joi.object({
	authenticationType: Joi.string()
		.valid(...Object.values(TwoFactorAuthenticationSettings))
		.required(),
	_codeVerification: Joi.string().optional(), // For email/phone verification
})

export const Disable2FADTO = Joi.object({
	password: Joi.string().required(), // Require password to disable for security
})

export const Change2FAMethodDTO = Joi.object({
	newAuthenticationType: Joi.string()
		.valid(...Object.values(TwoFactorAuthenticationSettings))
		.required(),
	_codeVerification: Joi.string().optional(), // For email/phone verification
})

