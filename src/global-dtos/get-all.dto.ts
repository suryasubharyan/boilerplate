import Joi from 'joi'

export const GetAllDTO = Joi.object({
	startIndex: Joi.string().optional(),
	itemsPerPage: Joi.string().optional(),
	search: Joi.string().optional(),
	cityName: Joi.string().optional(),
	state: Joi.string().optional(),
})
