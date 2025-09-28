import Joi from 'joi'

export const SignOutDTO = Joi.object({
	fcmToken: Joi.string().optional().allow(''),
	deviceType: Joi.string().optional().allow(''),
})
