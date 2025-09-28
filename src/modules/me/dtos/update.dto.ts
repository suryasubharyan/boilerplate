import Joi from 'joi'

export const UpdateDTO = Joi.object({
	email: Joi.string().email().optional(),
	phone: Joi.string().max(10).min(10).optional(),
	countryCode: Joi.string().min(1).max(4).optional(),
	oldPassword: Joi.string().min(8).max(30).optional(),
	newPassword: Joi.string().min(8).max(30).optional(),
	twoFactorAuthentication: Joi.boolean().optional(),
})
