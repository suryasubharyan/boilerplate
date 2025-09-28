import Joi from 'joi'
import objectIdValidatorHelper from '@helpers/object-id-validator.helper'

export const GetAllDTO = Joi.object({
	startIndex: Joi.number().optional(),
	itemsPerPage: Joi.number().optional(),
	type: Joi.string().valid('unread').optional(),
})
