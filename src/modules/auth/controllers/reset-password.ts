import '@core/declarations'
import authAfterEffectsHelper from '@helpers/auth-after-effects.helper'
import requestValidator from '@helpers/request-validator.helper'
import { CodeVerificationPurpose, CodeVerificationStatus } from '@models/code-verification'
import Dayjs from 'dayjs'
import { Request, Response } from 'express'
import { ResetPasswordDTO } from '../dto/reset-password.dto'
import { NotificationHelper, NotificationType } from '@helpers/notification.helper'

export default async function ResetPassword(req: Request, res: Response) {
	const errors = await requestValidator(ResetPasswordDTO, req.body)

	if (errors) {
		return res.unprocessableEntity({ errors })
	}
	const { _codeVerification, password } = req.body

	// Fetch the code Verification
	const existingCodeVerification = await App.Models.CodeVerification.findOne({
		_id: _codeVerification,
		status: CodeVerificationStatus.Passed,
		purpose: CodeVerificationPurpose.FORGOT_PASSWORD,
		isActive: true,
	})
		.select('+verificationLinkToken')
		.sort({ _id: -1 })

	if (!existingCodeVerification) {
		return res.forbidden({
			message: 'Invalid or expired password reset code. Please request a new code.',
		})
	}

	const { email, phone, countryCode } = existingCodeVerification
	let existingUser = null

	if (email) {
		// Fetch the user with email id
		existingUser = await App.Models.User.findByEmail(email)
	} else if (phone) {
		// Fetch the user with email id
		existingUser = await App.Models.User.findByPhone(phone, countryCode)
	} else {
		return res.badRequest({
			message: App.Messages.GeneralError.BadRequest,
		})
	}

	if (!existingUser) {
		return res.notFound({
			message: App.Messages.Auth.Error.AccountNotFound,
		})
	}

	// get expiration config
	const { EXPIRATION_TIME_FOR_PASSED_CODE, EXPIRATION_TIME_FOR_PASSED_CODE_UNIT } =
		App.Config.CODE_VERIFICATION

	// check expiry time for passed code verification
	if (
		Dayjs(existingCodeVerification.verificationPerformedAt).isBefore(
			Dayjs().subtract(EXPIRATION_TIME_FOR_PASSED_CODE, EXPIRATION_TIME_FOR_PASSED_CODE_UNIT)
		)
	) {
		existingCodeVerification.isActive = false
		await existingCodeVerification.save()
		return res.forbidden({
			message: App.Messages.Error.GeneralError.SessionExpired(),
		})
	}

	// Set New Password
	existingUser.password = password

	existingUser.accountMetadata.isFirstTimeLogin = false
	existingCodeVerification.isActive = false

	const [authToken] = await Promise.all([
		authAfterEffectsHelper.GenerateToken({
			_user: existingUser._id.toString(),
		}),
		existingUser.save(),
		existingCodeVerification.save(),
	])

	// Create password reset notification
	try {
		await NotificationHelper.createAuthNotification(
			existingUser._id.toString(),
			NotificationType.AUTH_PASSWORD_RESET,
			'Password Reset',
			'Your password has been successfully reset',
			{ 
				resetTime: new Date(),
				ipAddress: req.ip || req.connection.remoteAddress,
				via: existingCodeVerification.email ? 'email' : 'phone'
			}
		)
	} catch (notifError) {
		Logger.error(`Failed to create password reset notification: ${notifError.message}`)
	}

	// All Done
	return res.success({
		message: App.Messages.Auth.Success.ResetPasswordSuccessful(),
		items: { token: authToken.token },
	})
}
