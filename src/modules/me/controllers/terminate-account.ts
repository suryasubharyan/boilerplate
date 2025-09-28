import '@core/declarations'
import { Request, Response } from 'express'

export default async function TerminateAccount(req: Request, res: Response) {
	const { user } = req
	const existingUser = await App.Models.User.findById(user._id)

	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Profile.Error.AccountAlreadyTerminated(),
		})
	}

	existingUser.accountMetadata.isDeleted = true
	await existingUser.save()
	return res.success({
		message: App.Messages.Profile.Success.AccountTerminated(),
	})
}
