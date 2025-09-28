import '@core/declarations'
import { CodeVerificationPurpose } from '@models/code-verification'
import { Request, Response, NextFunction } from 'express'
import { authorize } from '../authorizer'

export const codeVerificationRequest = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (
			[
				CodeVerificationPurpose.USER_PHONE_UPDATE,
				CodeVerificationPurpose.UPDATE_2FA_SETTING_TO_EMAIL,
				CodeVerificationPurpose.UPDATE_2FA_SETTING_TO_PHONE,
			].includes(req.body.purpose)
		) {
			return authorize(req, res, next)
		}
		return next()
	} catch (error) {
		Logger.error(error)
		return res.internalServerError({ error })
	}
}
