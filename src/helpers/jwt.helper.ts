import '@core/declarations'
import { resolve } from 'path'
import jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

class JWTHelper {
	private JWT_SECRET = App.Config.JWT_SECRET
	private JWT_EXPIRY = App.Config.JWT_EXPIRY
	private REFRESH_TOKEN_EXPIRY = App.Config.REFRESH_TOKEN_EXPIRY
	private keyDir = resolve(`${__dirname}/../../keys`)
	private publicKeyPath = resolve(`${this.keyDir}/rsa.pub`)
	private privateKeyPath = resolve(`${this.keyDir}/rsa`)

	/**
	 * Get token user
	 * @param {string} token
	 * @returns
	 */
	async GetUser(payload: { token: string }) {
		const { token } = payload
		const verification = this.VerifyToken(token)

		if (verification.sub) {
			const user = await App.Models.User.findOne({
				_id: verification.sub,
				isActive: true,
			})

			// Enforce tokenVersion match to support logout-all
			if (user && typeof verification._tokenVersion === 'number') {
				if (user.tokenVersion !== verification._tokenVersion) {
					return {
						error: { message: 'Token invalidated. Please sign in again.' },
					}
				}
			}

			delete user?.password
			return {
				user,
				sessionIdentifier: verification?.sessionIdentifier,
			}
		}

		// error handling if token is expired
		if (verification?.name == 'TokenExpiredError') {
			return {
				error: {
					message: App.Messages.Helpers.JWTHelper.TokenExpired(),
					name: verification.name,
				},
			}
		}
		return null
	}

	/**
	 * Verify the token with rsa public key.
	 * @param {string} token
	 * @returns string | JwtPayload
	 */
	VerifyToken(token: string) {
		try {
			const publicKey = readFileSync(this.publicKeyPath)
			return jwt.verify(token, publicKey, {
				algorithms: ['RS256'],
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Create a signed JWT with the rsa private key.
	 * @param {*} payload
	 * @returns token
	 */
	GenerateToken(payload: any): string {
		const { _id: _user,  } = payload

		const privateKey = readFileSync(this.privateKeyPath)

		const jwtPayload = {
			roles: payload.roles,
			// include user tokenVersion for logout-all support
			// will be filled by caller if needed
			email: payload.email,
			_tokenVersion: payload._tokenVersion,
		}
		return jwt.sign(
			jwtPayload,
			{ key: privateKey.toString(), passphrase: this.JWT_SECRET },
			{
				algorithm: 'RS256',
				expiresIn: this.JWT_EXPIRY,
				subject: _user,
			}
		)
	}

	/**
	 * Create a refresh token
	 * @param {*} payload
	 * @returns refresh token
	 */
	GenerateRefreshToken(payload: any): string {
		const { _id: _user } = payload

		const privateKey = readFileSync(this.privateKeyPath)

		const jwtPayload = {
			type: 'refresh',
			_tokenVersion: payload._tokenVersion,
		}
		return jwt.sign(
			jwtPayload,
			{ key: privateKey.toString(), passphrase: this.JWT_SECRET },
			{
				algorithm: 'RS256',
				expiresIn: this.REFRESH_TOKEN_EXPIRY,
				subject: _user,
			}
		)
	}

	/**
	 * Generates RSA Key Pairs for JWT authentication
	 * It will generate the keys only if the keys are not present.
	 */
	GenerateKeys(): void {
		try {
			const keyDir = this.keyDir
			const publicKeyPath = this.publicKeyPath
			const privateKeyPath = this.privateKeyPath

			const JWT_SECRET = this.JWT_SECRET

			// Throw error if JWT_SECRET is not set
			if (!JWT_SECRET) {
				throw new Error('JWT_SECRET is not defined.')
			}

			// Check if config/keys exists or not
			if (!existsSync(keyDir)) {
				mkdirSync(keyDir)
			}

			// Check if PUBLIC and PRIVATE KEY exists else generate new
			if (!existsSync(publicKeyPath) && !existsSync(privateKeyPath)) {
				const result = generateKeyPairSync('rsa', {
					modulusLength: 4096,
					publicKeyEncoding: {
						type: 'spki',
						format: 'pem',
					},
					privateKeyEncoding: {
						type: 'pkcs8',
						format: 'pem',
						cipher: 'aes-256-cbc',
						passphrase: JWT_SECRET,
					},
				})

				const { publicKey, privateKey } = result
				writeFileSync(`${keyDir}/rsa.pub`, publicKey, { flag: 'wx' })
				writeFileSync(`${keyDir}/rsa`, privateKey, { flag: 'wx' })
				Logger.warn('New public and private key generated.')
			}
		} catch (error) {
			Logger.error(error)
		}
	}
}

// All Done
export default new JWTHelper()
