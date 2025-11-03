import MongoId from '@helpers/object-id-validator.helper'
import Joi from 'joi'

export const SignupDTO = Joi.object({
	_codeVerification: Joi.string()
		.custom(MongoId.Validate, 'ObjectId Validation')
		.optional(),

	email: Joi.string()
		.trim()
		.email({ tlds: { allow: false } })
		.optional(),

	countryCode: Joi.string()
		.trim()
		.min(2)
		.max(5)
		.optional(),

	phone: Joi.string()
		.trim()
		.min(5)
		.max(16)
		.optional(),

	password: Joi.string()
		.trim()
		.min(8)
		.max(64)
		.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&^_-]{8,}$/)
		.message('Password must contain at least 8 characters, including letters and numbers.')
		.optional(),

	firstName: Joi.string()
		.trim()
		.regex(/^[A-Za-z\s]+$/)
		.min(2)
		.max(30)
		.required()
		.messages({
			'string.empty': 'First name is required.',
			'string.pattern.base': 'First name can only contain letters and spaces.',
			'string.min': 'First name must be at least 2 characters.',
			'string.max': 'First name cannot exceed 30 characters.'
		}),

	lastName: Joi.string()
		.trim()
		.regex(/^[A-Za-z\s]+$/)
		.min(2)
		.max(30)
		.required()
		.messages({
			'string.empty': 'Last name is required.',
			'string.pattern.base': 'Last name can only contain letters and spaces.',
			'string.min': 'Last name must be at least 2 characters.',
			'string.max': 'Last name cannot exceed 30 characters.'
		}),

	location: Joi.object({
		area: Joi.string().trim().optional(),
		city: Joi.string().trim().optional(),
		state: Joi.string().trim().required(),
		country: Joi.string().trim().required(),
	}),

	_designation: Joi.string()
		.custom(MongoId.Validate, 'ObjectId Validation')
		.optional(),
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
		}),
	})
