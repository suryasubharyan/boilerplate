import '@core/declarations'
import requestValidator from '@helpers/request-validator.helper'
import { Request, Response } from 'express'
import { AvailabilityCheckDTO } from '../dto/availability-check.dto'
import { phone as Phone } from 'phone'

export default async function AvailabilityCheck(req: Request, res: Response) {
	const errors = await requestValidator(AvailabilityCheckDTO, req.query)

	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { email: _email, phone, countryCode } = req.query
	const email = typeof _email === 'string' ? _email.toLowerCase() : _email

	const searchField = {
		name: null,
		value: null,
	}
	let existingUserCount = 0
	if (email) {
		searchField.name = 'email'
		searchField.value = email
		existingUserCount = await App.Models.User.countDocuments({
			email,
			// isActive: true,
		})
	} else if (phone) {
		// Validate the phone number
		const isPhoneValid = Phone(`+${countryCode}${phone}`)
		if (!isPhoneValid.isValid) {
			return res.forbidden({
				message: App.Messages.CodeVerification.Error.InvalidPhoneNumber(),
			})
		}
		searchField.name = 'phone'
		searchField.value = phone
		existingUserCount = await App.Models.User.countDocuments({
			phone,
			countryCode,
			// isActive: true,
		})
	} else {
		return res.unprocessableEntity()
	}

	// All Done
	return res.success({
		message: App.Messages.Auth.Success.AvailabilityCheck(),
		item: {
			[searchField.name]: searchField.value,
			available: existingUserCount <= 0,
		},
	})
}
