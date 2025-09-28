import Joi from 'joi'
import MongoId from '@helpers/object-id-validator.helper'

export const ResetPasswordDTO = Joi.object({
	password: Joi.string().required().min(8).max(30),
	_codeVerification: Joi.string().custom(MongoId.Validate, 'ObjectId Validation').required(),
})
