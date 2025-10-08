import '@core/declarations'
import JWTHelper from '@helpers/jwt.helper'
import Dayjs from 'dayjs'

export class AuthAfterEffectsHelper {
	async GenerateToken(payload: { [key: string]: any }) {
		const { _user, email, phone, countryCode, includeRefreshToken = false } = payload

		const existingUser = await App.Models.User.findOne(
			_.omitBy({ _id: _user, email, phone, countryCode }, _.isNil)
		)

		// Generate a new JWT access token
		const token = JWTHelper.GenerateToken({
			_id: existingUser._id.toString(),
			_tokenVersion: existingUser.tokenVersion,
		})

		existingUser.lastSigninAt = Date.now()

		let refreshToken = null
		
		// Generate refresh token if requested
		if (includeRefreshToken) {
			refreshToken = JWTHelper.GenerateRefreshToken({
				_id: existingUser._id.toString(),
				_tokenVersion: existingUser.tokenVersion,
			})

			// Store refresh token and expiry in database
			existingUser.refreshToken = refreshToken
			
			// Parse refresh token expiry (e.g., '7d' -> 7 days from now)
			const expiryConfig = App.Config.REFRESH_TOKEN_EXPIRY
			const expiryMatch = expiryConfig.match(/^(\d+)([smhd])$/)
			if (expiryMatch) {
				const amount = parseInt(expiryMatch[1])
				const unit = expiryMatch[2]
				const unitMap = { s: 'second', m: 'minute', h: 'hour', d: 'day' }
				existingUser.refreshTokenExpiresAt = Dayjs().add(amount, unitMap[unit]).toDate()
			} else {
				// Default to 7 days
				existingUser.refreshTokenExpiresAt = Dayjs().add(7, 'day').toDate()
			}
		}

		await existingUser.save()

		return {
			token,
			...(refreshToken && { refreshToken }),
		}
	}
}

// All Done
export default new AuthAfterEffectsHelper()
