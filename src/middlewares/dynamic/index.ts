import '@core/declarations'
import { Request, Response, NextFunction } from 'express'
import { codeVerificationRequest } from './code-verification-request'

export enum DynamicRoutes {
	CodeVerificationRequest = 'CodeVerificationRequest',
}

const defaultHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		return next()
	} catch (error) {
		Logger.error(error)
		return res.internalServerError({ error })
	}
}

export const dynamic = (routeName: DynamicRoutes) => {
	if (routeName === DynamicRoutes.CodeVerificationRequest) {
		return codeVerificationRequest
	}
	return defaultHandler
}
