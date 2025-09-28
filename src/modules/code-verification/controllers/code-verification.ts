import '@core/declarations'
import requestValidator from '@helpers/request-validator.helper'
import { Request, Response } from 'express'
import { CodeVerificationDTO } from '../dtos/code-verification.dto'
import { CodeVerificationPurpose, CodeVerificationStatus } from '@models/code-verification'
import OTPHelper from '@helpers/otp.helper'
import AuthAfterEffectsHelper from '@helpers/auth-after-effects.helper'

export default async function CodeVerification(req: Request, res: Response) {
	const errors = await requestValidator(CodeVerificationDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { _codeVerification, code } = req.body

	// Find the existing verification record
	const existingCodeVerification = await App.Models.CodeVerification.findOne({
		_id: _codeVerification,
		status: { $in: [CodeVerificationStatus.Pending, CodeVerificationStatus.Failed] },
		isActive: true,
		verificationLinkToken: { $exists: false },
	})
		.select('+internalOTP')
		.sort({ _id: -1 })

	if (!existingCodeVerification) {
		return res.badRequest({
			message: App.Messages.CodeVerification.Error.MissingRecordToVerify(),
		})
	}

	// Construct payload for OTP verification
	const constructedKey = existingCodeVerification.email
		? existingCodeVerification.email
		: existingCodeVerification.phone && existingCodeVerification.countryCode
		? `+${existingCodeVerification.countryCode}${existingCodeVerification.phone}`
		: null

	if (!constructedKey) {
		throw new Error(App.Messages.GeneralError.SomethingWentWrong())
	}

	// Verify OTP code
	const verifyCodeResponse = await OTPHelper.VerifyCode(
		{ constructedKey, existingCodeVerification },
		code
	)

	const isCodeVerified = verifyCodeResponse.VerificationResponse.Valid ?? false

	// Batch updates for the document
	existingCodeVerification.verificationPerformedAt = Date.now()

	if (isCodeVerified) {
		// Mark as verified
		if (existingCodeVerification.purpose === CodeVerificationPurpose.SIGNIN_2FA) {
			existingCodeVerification.isActive = false
		}
		existingCodeVerification.status = CodeVerificationStatus.Passed

		// Save the verification result
		await existingCodeVerification.save()

		// If the purpose is SIGNIN_2FA, generate and send JWT token
		if (existingCodeVerification.purpose === CodeVerificationPurpose.SIGNIN_2FA) {
			const { token } = await AuthAfterEffectsHelper.GenerateToken({
				_user: existingCodeVerification._user,
			})
			return res.success({
				message: App.Messages.Auth.Success.SigninSuccessful(),
				item: { token },
			})
		}

		// If the purpose is USER_PHONE_UPDATE
		if (existingCodeVerification.purpose === CodeVerificationPurpose.USER_PHONE_UPDATE) {
			await App.Models.User.updateOne(
				{ _id: existingCodeVerification._user },
				{
					$set: {
						phone: existingCodeVerification.phone,
						countryCode: existingCodeVerification.countryCode,
					},
				}
			)
		}

		// Otherwise, send success response
		const existingCodeVerificationJSON = existingCodeVerification.toObject()
		delete existingCodeVerificationJSON.internalOTP
		return res.success({
			message: App.Messages.CodeVerification.Success.CodeVerified(),
			item: { codeVerification: existingCodeVerificationJSON },
		})
	} else {
		// Mark as failed and increment retry attempt
		existingCodeVerification.status = CodeVerificationStatus.Failed
		existingCodeVerification.internalOTP.usedRetryAttempt++

		// Save the verification result
		await existingCodeVerification.save()

		// Send failure response
		const existingCodeVerificationJSON = existingCodeVerification.toObject()
		delete existingCodeVerificationJSON.internalOTP
		return res.badRequest({
			message: App.Messages.CodeVerification.Error.CodeVerificationFailed(),
		})
	}
}
