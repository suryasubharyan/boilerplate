import { NextFunction } from 'express'
import JWTHelper from '@helpers/jwt.helper'

const authenticateSocket = async (socket: any, next: NextFunction) => {
	try {
		const token = socket.handshake.headers?.authorization

		if (!token) {
			return next(new Error(App.Messages.GeneralError.Unauthorized()))
		}

		// Verify token first to check type
		const verification = JWTHelper.VerifyToken(token)
		
		// Reject refresh tokens - they should only be used at /refresh-token endpoint
		if (verification?.type === 'refresh') {
			return next(new Error('Invalid token type. Please use access token.'))
		}

		const response = await JWTHelper.GetUser({ token })
		if (!response.user) {
			return next(new Error(App.Messages.GeneralError.Unauthorized()))
		}

		if (response.error) {
			return next(new Error(response.error.message))
		}
		const { user } = response
		socket.id = user._id.toString()
		next()
	} catch (error) {
		Logger.error(error)
		return next(new Error(error))
	}
}
export default authenticateSocket
