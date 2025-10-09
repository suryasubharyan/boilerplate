import '@core/declarations'
import { Request, Response } from 'express'

export default async function Get2FAStatus(req: Request, res: Response) {
	const { user } = req

	const existingUser = await App.Models.User.findById(user._id)

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	// All Done
	return res.success({
		message: '2FA status retrieved successfully.',
		item: {
			twoFactorAuthentication: existingUser.twoFactorAuthentication,
			emailVerified: existingUser.emailVerified,
			phoneVerified: existingUser.phoneVerified,
			hasEmail: !!existingUser.email,
			hasPhone: !!existingUser.phone,
		},
	})
}

