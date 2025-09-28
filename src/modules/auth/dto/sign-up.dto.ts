import MongoId from '@helpers/object-id-validator.helper'
import Joi from 'joi'

export const SignupDTO = Joi.object({
	_codeVerification: Joi.string().custom(MongoId.Validate, 'ObjectId Validation').required(),
	email: Joi.string().email(),
	countryCode: Joi.string().min(2),
	phone: Joi.string().min(5).max(16),
	password: Joi.string(),
	firstName: Joi.string().required(),
	lastName: Joi.string().required(),
	location: Joi.object({
		area: Joi.string().optional(),
		city: Joi.string().optional(),
		state: Joi.string().required(),
		country: Joi.string().required(),
	}),
	_designation: Joi.string().custom(MongoId.Validate, 'ObjectId Validation').required(),
})
	.xor('email', 'phone')
	.when(Joi.object({ email: Joi.exist() }), {
		then: Joi.object({
			email: Joi.required(),
			password: Joi.required(),
		}),
	})
	.when(Joi.object({ phone: Joi.exist() }), {
		then: Joi.object({
			countryCode: Joi.required(),
			phone: Joi.required(),
		}),
	})
