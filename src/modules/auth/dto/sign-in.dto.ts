import MongoId from '@helpers/object-id-validator.helper'
import Joi from 'joi'

export const SignInDTO = Joi.object({
	fcmToken: Joi.string().optional(),
	deviceType: Joi.string().valid('ios', 'others').optional(),
	email: Joi.string().email(),
	countryCode: Joi.string().min(2),
	phone: Joi.string().min(5).max(16),
	password: Joi.string(),
	_codeVerification: Joi.string().custom(MongoId.Validate, 'ObjectId Validation'),
	rememberMe: Joi.boolean().optional()
})
	.xor('email', 'phone')
	.when(Joi.object({ email: Joi.exist() }).unknown(), {
		then: Joi.object({
			email: Joi.required(),
			password: Joi.required(),
		}),
	})
	.when(Joi.object({ phone: Joi.exist() }).unknown(), {
		then: Joi.object({
			countryCode: Joi.required(),
			phone: Joi.required(),
			_codeVerification: Joi.string()
				.custom(MongoId.Validate, 'ObjectId Validation')
				.required(),
		}),
	})
