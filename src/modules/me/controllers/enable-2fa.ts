import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { Enable2FADTO } from '../dtos/update-2fa.dto'
import { TwoFactorAuthenticationSettings } from '@models/user.model'

export default async function Enable2FA(req: Request, res: Response) {
	const errors = await requestValidator(Enable2FADTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { authenticationType, _codeVerification } = req.body
	const { user } = req

	const existingUser = await App.Models.User.findById(user._id)

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated(),
		})
	}

	// Check if 2FA is already enabled
	if (existingUser.twoFactorAuthentication.isActivated) {
		return res.badRequest({
			message: '2FA is already enabled. Use change-2fa-method to switch methods.',
		})
	}

	// For Email 2FA - verify email is set and verified
	if (authenticationType === TwoFactorAuthenticationSettings.Email) {
		if (!existingUser.email) {
			return res.badRequest({
				message: 'Email is required for Email 2FA. Please add an email first.',
			})
		}
		if (!existingUser.emailVerified) {
			return res.badRequest({
				message: 'Please verify your email before enabling Email 2FA.',
			})
		}
	}

	// For Phone 2FA - verify phone is set and verified
	if (authenticationType === TwoFactorAuthenticationSettings.Phone) {
		if (!existingUser.phone || !existingUser.countryCode) {
			return res.badRequest({
				message: 'Phone number is required for Phone 2FA. Please add a phone number first.',
			})
		}
		if (!existingUser.phoneVerified) {
			return res.badRequest({
				message: 'Please verify your phone number before enabling Phone 2FA.',
			})
		}
	}

	// For Authenticator App - check if setup is complete
	if (authenticationType === TwoFactorAuthenticationSettings.AuthenticatorApp) {
		// Check if TOTP secret exists (setup completed via verify-authenticator)
		const userWithSecret = await App.Models.User.findById(user._id).select('+twoFactorAuthentication.totpSecret')
		
		if (!userWithSecret.twoFactorAuthentication.totpSecret) {
			return res.badRequest({
				message:
					'Authenticator App not setup. Use /setup-authenticator and /verify-authenticator first.',
			})
		}
		
		// If secret exists, it means setup is complete, allow enabling
	}

	// Enable 2FA
	existingUser.twoFactorAuthentication.isActivated = true
	existingUser.twoFactorAuthentication.authenticationType = authenticationType

	await existingUser.save()

	// All Done
	return res.success({
		message: `2FA enabled successfully using ${authenticationType}.`,
		item: {
			twoFactorAuthentication: existingUser.twoFactorAuthentication,
		},
	})
}

