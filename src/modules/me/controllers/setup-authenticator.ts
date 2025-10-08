import '@core/declarations'
import { Request, Response } from 'express'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

export default async function SetupAuthenticator(req: Request, res: Response) {
	const { user } = req

	const existingUser = await App.Models.User.findById(user._id).select('+twoFactorAuthentication.totpSecret')

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated,
		})
	}

	// Generate TOTP secret
	const secret = speakeasy.generateSecret({
		name: `${App.Config.AWS.BRAND_NAME} (${existingUser.email || existingUser.phone})`,
		issuer: App.Config.AWS.BRAND_NAME,
		length: 32,
	})

	// Store the secret temporarily (not activated yet - will be activated after verification)
	existingUser.twoFactorAuthentication.totpSecret = secret.base32

	await existingUser.save()

	// Generate QR code
	const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url)

	// All Done
	return res.success({
		message: 'Authenticator setup initiated. Scan the QR code with Microsoft Authenticator or any TOTP app.',
		item: {
			secret: secret.base32, // Manual entry key
			qrCode: qrCodeDataURL, // QR code as data URL
			otpauthUrl: secret.otpauth_url, // OTP auth URL
		},
	})
}

