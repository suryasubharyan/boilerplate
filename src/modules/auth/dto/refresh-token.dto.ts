import Joi from 'joi'

export const RefreshTokenDTO = Joi.object({
	refreshToken: Joi.string().required(),
})

