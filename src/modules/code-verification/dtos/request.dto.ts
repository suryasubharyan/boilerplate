import Joi from 'joi'
import objectIdValidatorHelper from '@helpers/object-id-validator.helper'
import { CodeVerificationPurpose, CodeVerificationVia } from '@models/code-verification'

export const CodeVerificationDTO = Joi.object({
	sessionIdentifier: Joi.string().optional(),
	code: Joi.string().required(),
	_codeVerification: Joi.string()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.required(),
})

export const LinkVerificationDTO = Joi.object({
	token: Joi.string().required(),
})

export const ResendRequestDTO = Joi.object({
	_codeVerification: Joi.string()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.required(),
})

export const RequestDTO = Joi.object({
	email: Joi.string().email().optional(),
	via: Joi.string()
		.valid(...Object.values(CodeVerificationVia))
		.required(),
	purpose: Joi.string()
		.valid(...Object.values(CodeVerificationPurpose))
		.required(),
	phone: Joi.string().min(3).max(15).optional(),
	countryCode: Joi.string().min(1).max(3).optional(),
	_user: Joi.string().custom(objectIdValidatorHelper.Validate, 'ObjectId Validation').optional(),
	twoFactorAuthenticationCode: Joi.string().optional().min(3),
})

export const RequestForSignin2FADTO = Joi.object({
	_user: Joi.string().custom(objectIdValidatorHelper.Validate, 'ObjectId Validation').required(),
})
export const RequestByEmailForgotPasswordDTO = Joi.object({
	email: Joi.string().email().required(),
	via: Joi.string()
		.valid(...Object.values(CodeVerificationVia))
		.optional(),
	purpose: Joi.string()
		.valid(...Object.values(CodeVerificationPurpose))
		.optional(),
	phone: Joi.string().min(3).max(15).optional(),
	countryCode: Joi.string().min(1).max(3).optional(),
})
export const RequestByPhoneDTO = Joi.object({
	phone: Joi.string().min(3).max(15).required(),
	countryCode: Joi.string().min(1).max(3).required(),
})
export const RequestByEmailDTO = Joi.object({
	email: Joi.string().email().required(),
})
export const RequestByEmailOrPhoneDTO = Joi.object({
	email: Joi.when(Joi.exist(), {
		then: Joi.string().email(),
		otherwise: Joi.forbidden(),
	}),

	phone: Joi.when(Joi.exist(), {
		then: Joi.string().min(3).max(15).message('Invalid phone number'),
		otherwise: Joi.forbidden(),
	}),

	countryCode: Joi.when('phone', {
		is: Joi.exist(),
		then: Joi.string().min(1).max(3).message('Invalid country code'),
		otherwise: Joi.forbidden(),
	}),
	via: Joi.string()
		.valid(...Object.values(CodeVerificationVia))
		.required(),
	purpose: Joi.string()
		.valid(...Object.values(CodeVerificationPurpose))
		.required(),
})

export const RequestForUpdate2FAByEmail = Joi.object({
	email: Joi.string().email().required(),
	via: Joi.string()
		.valid(...Object.values(CodeVerificationVia))
		.required(),
	purpose: Joi.string()
		.valid(...Object.values(CodeVerificationPurpose))
		.required(),
})
