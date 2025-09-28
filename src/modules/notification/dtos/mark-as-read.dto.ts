import Joi from 'joi'
import objectIdValidatorHelper from '@helpers/object-id-validator.helper'

export const MarkAsReadDTO = Joi.object({
	isMarkAll: Joi.boolean(),
	_notification: Joi.when('isMarkAll', {
		is: false,
		then: Joi.string().custom(objectIdValidatorHelper.Validate, 'ObjectId').required(),
		otherwise: Joi.forbidden(),
	}),
})
