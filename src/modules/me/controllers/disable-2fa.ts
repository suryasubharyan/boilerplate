import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { Disable2FADTO } from '../dtos/update-2fa.dto'
import bcrypt from 'bcrypt'

export default async function Disable2FA(req: Request, res: Response) {
	const errors = await requestValidator(Disable2FADTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { password } = req.body
	const { user } = req

	const existingUser = await App.Models.User.findById(user._id).select('+password')

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated,
		})
	}

	// Check if 2FA is already disabled
	if (!existingUser.twoFactorAuthentication.isActivated) {
		return res.badRequest({
			message: '2FA is already disabled.',
		})
	}

	// Verify password for security (important security measure!)
	const isPasswordValid = await bcrypt.compare(password, existingUser.password)
	if (!isPasswordValid) {
		return res.forbidden({
			message: 'Invalid password. Cannot disable 2FA.',
		})
	}

	// Disable 2FA
	existingUser.twoFactorAuthentication.isActivated = false
	existingUser.twoFactorAuthentication.authenticationType = undefined

	await existingUser.save()

	// All Done
	return res.success({
		message: '2FA disabled successfully.',
		item: {
			twoFactorAuthentication: existingUser.twoFactorAuthentication,
		},
	})
}

