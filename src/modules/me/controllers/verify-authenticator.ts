import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { VerifyAuthenticatorDTO } from '../dtos/verify-authenticator.dto'
import speakeasy from 'speakeasy'
import { TwoFactorAuthenticationSettings } from '@models/user.model'

export default async function VerifyAuthenticator(req: Request, res: Response) {
	const errors = await requestValidator(VerifyAuthenticatorDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { token } = req.body
	const { user } = req

	const existingUser = await App.Models.User.findById(user._id).select('+twoFactorAuthentication.totpSecret')

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated,
		})
	}

	// Check if secret exists
	if (!existingUser.twoFactorAuthentication.totpSecret) {
		return res.badRequest({
			message: 'No authenticator setup found. Please setup authenticator first.',
		})
	}

	// Verify the token
	const verified = speakeasy.totp.verify({
		secret: existingUser.twoFactorAuthentication.totpSecret,
		encoding: 'base32',
		token: token,
		window: 2, // Allow 2 time steps before/after for clock drift
	})

	if (!verified) {
		return res.badRequest({
			message: 'Invalid authenticator code. Please try again.',
		})
	}

	// Enable authenticator 2FA
	existingUser.twoFactorAuthentication.isActivated = true
	existingUser.twoFactorAuthentication.authenticationType = TwoFactorAuthenticationSettings.AuthenticatorApp

	await existingUser.save()

	// All Done
	return res.success({
		message: 'Authenticator verified and enabled successfully!',
		item: {
			twoFactorAuthentication: {
				isActivated: existingUser.twoFactorAuthentication.isActivated,
				authenticationType: existingUser.twoFactorAuthentication.authenticationType,
			},
		},
	})
}

