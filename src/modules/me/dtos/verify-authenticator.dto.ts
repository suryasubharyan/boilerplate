import Joi from 'joi'

export const VerifyAuthenticatorDTO = Joi.object({
	token: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
})

