import Joi from 'joi'

export const ChangePasswordDTO = Joi.object({
	oldPassword: Joi.string().min(8).max(30).required(),
	newPassword: Joi.string().min(8).max(30).required(),
	logoutOtherDevices: Joi.boolean().optional().default(false),
})

