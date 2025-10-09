import '@core/declarations'
import _ from 'lodash'
import requestValidator from '@helpers/request-validator.helper'
import { Request, Response } from 'express'
import { ResendRequestDTO } from '../dtos/resend-request.dto'
import { MailHelper } from '@helpers/email.helper'
import otpHelper from '@helpers/otp.helper'
// import { GenerateRandomNumberOfLength } from '@core/utils'

export default async function CodeVerificationResendRequest(req: Request, res: Response) {
	const errors = await requestValidator(ResendRequestDTO, req.params)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { _codeVerification } = req.params

	const payload = _.omitBy(
		{
			_codeVerification,
		},
		_.isNil
	)
	const codeVerification = await App.Models.CodeVerification.findOne({
		_id: payload._codeVerification,
		isActive: true,
	})

	if (!codeVerification) {
		return res.notFound({
			message: App.Messages.CodeVerification.Error.CodeVerificationNotFound,
		})
	}
	const OTP = '1234' //GenerateRandomNumberOfLength(4)
	codeVerification.internalOTP = {
		code: OTP.toString(),
	}
	if (codeVerification.email) {
		await MailHelper.send({
			to: codeVerification.email,
			subject: 'Verify Your Email',
			templateName: 'verify-email',
			data: { OTP },
		})
	}
	if (codeVerification.phone && codeVerification.countryCode) {
		await otpHelper.SendCodeToMobile(
			codeVerification.countryCode + codeVerification.phone,
			App.Messages.Helpers.OTPHelper.CodeSentSuccessFullyOverEmail({
				OTP,
				BrandName: App.Config.AWS.BRAND_NAME,
			})
		)
	}

	await codeVerification.save()

	// All Done
	const codeVerificationJSON = codeVerification.toObject()
	delete codeVerificationJSON.internalOTP
	delete codeVerificationJSON.verificationLinkToken
	return res.success({
		message: App.Messages.CodeVerification.Success.CodeResent({
			type: payload.verificationLinkToken ? 'link' : 'code',
			to: codeVerificationJSON.email ? 'email' : 'phone number',
		}),
		item: {
			...codeVerificationJSON,
		},
	})
}
