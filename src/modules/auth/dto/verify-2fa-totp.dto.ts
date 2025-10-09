import Joi from 'joi'
import MongoId from '@helpers/object-id-validator.helper'

export const Verify2FATotpDTO = Joi.object({
	_user: Joi.string().custom(MongoId.Validate, 'ObjectId Validation').required(),
	token: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
})

