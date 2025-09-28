import Joi from 'joi'
import objectIdValidatorHelper from '@helpers/object-id-validator.helper'

export const RemoveNotiDTO = Joi.object({
	isRemoveAll: Joi.boolean(),
	_notification: Joi.when('isRemoveAll', {
		is: false,
		then: Joi.string().custom(objectIdValidatorHelper.Validate, 'ObjectId').required(),
		otherwise: Joi.forbidden(),
	}),
})
