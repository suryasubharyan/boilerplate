import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import bcrypt from 'bcrypt'
import authAfterEffectsHelper from '@helpers/auth-after-effects.helper'
import { SignInDTO } from '../dto/sign-in.dto'
import { CodeVerificationStatus, CodeVerificationPurpose } from '@models/code-verification'
import Dayjs from 'dayjs'
import { NotificationHelper, NotificationType } from '@helpers/notification.helper'

export default async function SignIn(req: Request, res: Response) {
	const errors = await requestValidator(SignInDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const {
		email,
		countryCode,
		phone,
		password,
		_codeVerification,
		fcmToken,
		deviceType,
		rememberMe = false,
	} = req.body

	const userPromise = email
		? App.Models.User.findByEmail(email.trim().toLowerCase()).select('+password')
		: App.Models.User.findByPhone(phone.trim(), countryCode.trim())

	const [existingUser] = await Promise.all([userPromise])

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	// Check if user is blocked by admin
	if (existingUser.accountMetadata.isBlockedByAdmin) {
		return res.forbidden({
			message:
				existingUser.accountMetadata.customBlockMessage ||
				App.Messages.GeneralError.AccountBlockedByAdmin,
		})
	}
	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated(),
		})
	}

	if (email && !(await bcrypt.compare(password, existingUser.password))) {
		return res.forbidden({ message: App.Messages.Auth.Error.InvalidCredentials() })
	}

	// Enforce verified contact before issuing token
	if (email && !existingUser.emailVerified) {
		return res.forbidden({ message: 'Please verify your email to sign in.' })
	}

	if (phone && countryCode) {
		const codeVerification = await App.Models.CodeVerification.findOne({
			_id: _codeVerification,
			status: CodeVerificationStatus.Passed,
			purpose: CodeVerificationPurpose.SIGNIN_2FA,
			isActive: true,
		}).sort({ createdAt: -1 })

		if (!codeVerification) {
			return res.badRequest({
				message: App.Messages.Auth.Error.PreSignCodeVerificationFailed(),
			})
		}

		// Get expiration config and check for code expiry
		const { EXPIRATION_TIME_FOR_PASSED_CODE, EXPIRATION_TIME_FOR_PASSED_CODE_UNIT } =
			App.Config.CODE_VERIFICATION
		if (
			Dayjs(codeVerification.verificationPerformedAt).isBefore(
				Dayjs().subtract(
					EXPIRATION_TIME_FOR_PASSED_CODE,
					EXPIRATION_TIME_FOR_PASSED_CODE_UNIT
				)
			)
		) {
			codeVerification.isActive = false
			await codeVerification.save()
			return res.forbidden({ message: App.Messages.GeneralError.SessionExpired })
		}
	}

	// If signing in via phone path, ensure phone is verified
	if (phone && countryCode && !existingUser.phoneVerified) {
		return res.forbidden({ message: 'Please verify your phone number to sign in.' })
	}

	const tokenPromise = authAfterEffectsHelper.GenerateToken({
		_user: existingUser._id.toString(),
		includeRefreshToken: true, // Generate refresh token on sign-in
	})

	if (fcmToken && deviceType) {
		existingUser.registeredDevices.addToSet({ fcmToken, deviceType })
		await existingUser.save()
	}

	if (existingUser.twoFactorAuthentication.isActivated) {
		return res.success({
			message: App.Messages.Auth.Success.SigninSuccessfulProceedFor2FA,
			items: {
				_user: existingUser._id,
			},
		})
	}

	const { token, refreshToken } = await tokenPromise

	// Create login notification for new device
	if (fcmToken && deviceType) {
		try {
			await NotificationHelper.createAuthNotification(
				existingUser._id.toString(),
				NotificationType.AUTH_LOGIN_NEW_DEVICE,
				'New Device Login',
				`You've signed in from a new ${deviceType} device`,
				{ 
					deviceType, 
					fcmToken: fcmToken.substring(0, 10) + '...', // Partial token for privacy
					loginTime: new Date(),
					ipAddress: req.ip || req.connection.remoteAddress
				}
			)
		} catch (notifError) {
			Logger.error(`Failed to create login notification: ${notifError.message}`)
		}
	}

	return res.success({
		message: App.Messages.Auth.Success.SigninSuccessful(),
		items: { token, refreshToken },
	})
}
