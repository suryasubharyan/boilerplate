import joi from 'joi'

export const AvailabilityCheckDTO = joi.object({
	email: joi.when(joi.exist(), {
		then: joi.string().email(),
		otherwise: joi.forbidden(),
	}),
	phone: joi.string().min(3).max(15).optional(),
	countryCode: joi.string().min(1).max(3).optional(),
})
