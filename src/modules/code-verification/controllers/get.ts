import '@core/declarations'
import { CodeVerificationStatus } from '@models/code-verification'
import { Request, Response } from 'express'
import Dayjs from 'dayjs'
import { GetCodeVerificationDTO } from '../dtos/get.dto'
import requestValidator from '@helpers/request-validator.helper'

export default async function Get(req: Request, res: Response) {
	const errors = await requestValidator(GetCodeVerificationDTO, req.params)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}
	const { _codeVerification } = req.params

	// Find existing CodeVerification
	const existingCodeVerification = await App.Models.CodeVerification.findOne({
		_id: _codeVerification,
		isActive: true,
	}).select('status createdAt verificationPerformedAt verificationLinkToken')

	if (!existingCodeVerification) {
		return res.badRequest({
			message: App.Messages.CodeVerification.Error.MissingRecordToVerify(),
		})
	}

	// get expiration config
	const {
		EXPIRATION_TIME,
		EXPIRATION_TIME_UNIT,
		EXPIRATION_TIME_FOR_PASSED_CODE,
		EXPIRATION_TIME_FOR_PASSED_CODE_UNIT,
	} = App.Config.CODE_VERIFICATION

	// check expiry time of link
	if (
		[CodeVerificationStatus.Pending, CodeVerificationStatus.Failed].includes(
			existingCodeVerification.status
		) &&
		Dayjs(existingCodeVerification.createdAt).isBefore(
			Dayjs().subtract(EXPIRATION_TIME, EXPIRATION_TIME_UNIT)
		)
	) {
		existingCodeVerification.isActive = false
		await existingCodeVerification.save()
		return res.unauthorized({
			message: App.Messages.CodeVerification.Error.CodeVerificationExpired({
				type: existingCodeVerification.verificationLinkToken ? 'link' : 'code',
			}),
		})
	} else if (
		existingCodeVerification.status === CodeVerificationStatus.Passed &&
		Dayjs(existingCodeVerification.verificationPerformedAt).isBefore(
			Dayjs().subtract(EXPIRATION_TIME_FOR_PASSED_CODE, EXPIRATION_TIME_FOR_PASSED_CODE_UNIT)
		)
	) {
		existingCodeVerification.isActive = false
		await existingCodeVerification.save()
		return res.unauthorized({
			message: App.Messages.CodeVerification.Error.CodeVerificationExpired({
				type: existingCodeVerification.verificationLinkToken ? 'link' : 'code',
			}),
		})
	}

	// All Done
	const existingCodeVerificationJSON = existingCodeVerification.toObject()
	delete existingCodeVerificationJSON.verificationLinkToken
	return res.success({
		message: App.Messages.CodeVerification.Success.GetSuccess(),
		item: {
			codeVerification: existingCodeVerificationJSON,
		},
	})
}
