import '@core/declarations'
import Joi from 'joi'
import objectIdValidatorHelper from '@helpers/object-id-validator.helper'

export const ResendRequestDTO = Joi.object({
	_codeVerification: Joi.string()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.required(),
})
