import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { UpdatePhoneRequestDTO } from '../dtos/update-phone.dto'
import { CodeVerificationPurpose } from '@models/code-verification'
import otpHelper from '@helpers/otp.helper'
import { GenerateRandomNumberOfLength } from '@core/utils'

export default async function UpdatePhone(req: Request, res: Response) {
	const errors = await requestValidator(UpdatePhoneRequestDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { phone, countryCode } = req.body
	const { user } = req

	// Check if phone is already in use by another user
	const existingUserCount = await App.Models.User.countDocuments({
		_id: { $ne: user._id },
		phone,
		countryCode,
		isActive: true,
	})

	if (existingUserCount) {
		return res.conflict({
			message: App.Messages.CodeVerification.Error.PhoneAlreadyInUse(),
		})
	}

	// Check if phone is same as current phone
	const currentUser = await App.Models.User.findById(user._id)
	if (currentUser.phone === phone && currentUser.countryCode === countryCode) {
		return res.badRequest({
			message: 'This is already your current phone number.',
		})
	}

	// Generate OTP and create verification record
	const OTP = GenerateRandomNumberOfLength(4)
	const codeVerification = await App.Models.CodeVerification.create({
		_user: user._id,
		phone,
		countryCode,
		purpose: CodeVerificationPurpose.USER_PHONE_UPDATE,
		internalOTP: {
			code: OTP.toString(),
		},
	})

	// Send verification SMS
	await otpHelper.SendCodeToMobile(
		countryCode + phone,
		App.Messages.Helpers.OTPHelper.CodeSentSuccessFullyOverEmail({
			OTP,
			BrandName: App.Config.AWS.BRAND_NAME,
		})
	)

	// All Done
	const codeVerificationJSON = codeVerification.toObject()
	delete codeVerificationJSON.internalOTP
	delete codeVerificationJSON.verificationLinkToken

	return res.success({
		message: `Verification code sent to ${countryCode}${phone}. Please verify to update your phone number.`,
		item: codeVerificationJSON,
	})
}

