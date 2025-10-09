import Joi from 'joi'

export const UpdateEmailRequestDTO = Joi.object({
	email: Joi.string().email().required(),
})

export const UpdateEmailVerifyDTO = Joi.object({
	_codeVerification: Joi.string().required(),
	code: Joi.string().required(),
})

