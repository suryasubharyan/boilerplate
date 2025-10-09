import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { UpdateEmailRequestDTO } from '../dtos/update-email.dto'
import { CodeVerificationPurpose } from '@models/code-verification'
import { MailHelper } from '@helpers/email.helper'
import { GenerateRandomNumberOfLength } from '@core/utils'

export default async function UpdateEmail(req: Request, res: Response) {
	const errors = await requestValidator(UpdateEmailRequestDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { email } = req.body
	const { user } = req

	// Check if email is already in use by another user
	const existingUserCount = await App.Models.User.countDocuments({
		_id: { $ne: user._id },
		email: email.toLowerCase(),
		isActive: true,
	})

	if (existingUserCount) {
		return res.conflict({
			message: App.Messages.Auth.Error.EmailAlreadyInUse(),
		})
	}

	// Check if email is same as current email
	const currentUser = await App.Models.User.findById(user._id)
	if (currentUser.email?.toLowerCase() === email.toLowerCase()) {
		return res.badRequest({
			message: 'This is already your current email address.',
		})
	}

	// Generate OTP and create verification record
	const OTP = GenerateRandomNumberOfLength(4)
	const codeVerification = await App.Models.CodeVerification.create({
		_user: user._id,
		email: email.toLowerCase(),
		purpose: CodeVerificationPurpose.USER_EMAIL_UPDATE,
		internalOTP: {
			code: OTP.toString(),
		},
	})

	// Send verification email
	await MailHelper.send({
		to: email,
		subject: 'Verify Your New Email',
		templateName: 'verify-email',
		data: { OTP },
	})

	// All Done
	const codeVerificationJSON = codeVerification.toObject()
	delete codeVerificationJSON.internalOTP
	delete codeVerificationJSON.verificationLinkToken

	return res.success({
		message: `Verification code sent to ${email}. Please verify to update your email.`,
		item: codeVerificationJSON,
	})
}

