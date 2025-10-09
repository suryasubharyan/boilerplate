import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { RefreshTokenDTO } from '../dto/refresh-token.dto'
import JWTHelper from '@helpers/jwt.helper'
import Dayjs from 'dayjs'

export default async function RefreshToken(req: Request, res: Response) {
	const errors = await requestValidator(RefreshTokenDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { refreshToken } = req.body

	// Verify refresh token
	const verification = JWTHelper.VerifyToken(refreshToken)

	if (verification?.name === 'TokenExpiredError') {
		return res.unauthorized({
			message: 'Refresh token expired. Please sign in again.',
		})
	}

	if (!verification.sub || verification.type !== 'refresh') {
		return res.unauthorized({
			message: 'Invalid refresh token.',
		})
	}

	// Find user with refresh token
	const existingUser = await App.Models.User.findOne({
		_id: verification.sub,
		isActive: true,
	}).select('+refreshToken +refreshTokenExpiresAt')

	if (!existingUser) {
		return res.notFound({
			message: App.Messages.Auth.Error.AccountNotFound(),
		})
	}

	// Check if account is deleted or blocked
	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated(),
		})
	}

	if (existingUser.accountMetadata.isBlockedByAdmin) {
		return res.forbidden({
			message:
				existingUser.accountMetadata.customBlockMessage ||
				App.Messages.GeneralError.AccountBlockedByAdmin,
		})
	}

	// Verify refresh token matches stored token
	if (existingUser.refreshToken !== refreshToken) {
		return res.unauthorized({
			message: 'Invalid refresh token.',
		})
	}

	// Check if refresh token is expired
	if (existingUser.refreshTokenExpiresAt && Dayjs().isAfter(existingUser.refreshTokenExpiresAt)) {
		return res.unauthorized({
			message: 'Refresh token expired. Please sign in again.',
		})
	}

	// Check token version for logout-all support
	if (
		typeof verification._tokenVersion === 'number' &&
		existingUser.tokenVersion !== verification._tokenVersion
	) {
		return res.unauthorized({
			message: 'Token invalidated. Please sign in again.',
		})
	}

	// Generate new access token
	const newAccessToken = JWTHelper.GenerateToken({
		_id: existingUser._id.toString(),
		_tokenVersion: existingUser.tokenVersion,
	})

	// Optionally generate new refresh token (rotation)
	const newRefreshToken = JWTHelper.GenerateRefreshToken({
		_id: existingUser._id.toString(),
		_tokenVersion: existingUser.tokenVersion,
	})

	// Update refresh token in database
	existingUser.refreshToken = newRefreshToken
	
	// Update expiry
	const expiryConfig = App.Config.REFRESH_TOKEN_EXPIRY
	const expiryMatch = expiryConfig.match(/^(\d+)([smhd])$/)
	if (expiryMatch) {
		const amount = parseInt(expiryMatch[1])
		const unit = expiryMatch[2]
		const unitMap = { s: 'second', m: 'minute', h: 'hour', d: 'day' }
		existingUser.refreshTokenExpiresAt = Dayjs().add(amount, unitMap[unit]).toDate()
	} else {
		existingUser.refreshTokenExpiresAt = Dayjs().add(7, 'day').toDate()
	}

	await existingUser.save()

	// All Done
	return res.success({
		message: 'Token refreshed successfully.',
		items: {
			token: newAccessToken,
			refreshToken: newRefreshToken,
		},
	})
}

