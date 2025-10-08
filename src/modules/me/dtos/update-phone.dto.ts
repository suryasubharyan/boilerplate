import Joi from 'joi'

export const UpdatePhoneRequestDTO = Joi.object({
	phone: Joi.string().min(10).max(10).required(),
	countryCode: Joi.string().min(1).max(4).required(),
})

export const UpdatePhoneVerifyDTO = Joi.object({
	_codeVerification: Joi.string().required(),
	code: Joi.string().required(),
})

