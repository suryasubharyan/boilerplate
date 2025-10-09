import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { Verify2FATotpDTO } from '../dto/verify-2fa-totp.dto'
import speakeasy from 'speakeasy'
import authAfterEffectsHelper from '@helpers/auth-after-effects.helper'

export default async function Verify2FATotp(req: Request, res: Response) {
	const errors = await requestValidator(Verify2FATotpDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { _user, token } = req.body

	const existingUser = await App.Models.User.findOne({
		_id: _user,
		isActive: true,
	}).select('+twoFactorAuthentication.totpSecret')

	if (!existingUser) {
		return res.notFound({
			message: App.Messages.Auth.Error.AccountNotFound(),
		})
	}

	// Check if account is deleted or blocked
	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated(),
		})
	}

	if (existingUser.accountMetadata.isBlockedByAdmin) {
		return res.forbidden({
			message:
				existingUser.accountMetadata.customBlockMessage ||
				App.Messages.GeneralError.AccountBlockedByAdmin,
		})
	}

	// Check if 2FA is activated and is authenticator type
	if (!existingUser.twoFactorAuthentication.isActivated) {
		return res.badRequest({
			message: '2FA is not enabled for this account.',
		})
	}

	if (!existingUser.twoFactorAuthentication.totpSecret) {
		return res.badRequest({
			message: 'Authenticator not setup for this account.',
		})
	}

	// Verify the TOTP token
	const verified = speakeasy.totp.verify({
		secret: existingUser.twoFactorAuthentication.totpSecret,
		encoding: 'base32',
		token: token,
		window: 2, // Allow 2 time steps before/after for clock drift
	})

	if (!verified) {
		return res.unauthorized({
			message: 'Invalid authenticator code.',
		})
	}

	// Generate tokens and complete sign-in
	const { token: accessToken, refreshToken } = await authAfterEffectsHelper.GenerateToken({
		_user: existingUser._id.toString(),
		includeRefreshToken: true,
	})

	// All Done
	return res.success({
		message: App.Messages.Auth.Success.SigninSuccessful(),
		items: { token: accessToken, refreshToken },
	})
}

