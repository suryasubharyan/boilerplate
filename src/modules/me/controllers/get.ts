import '@core/declarations'
import { Request, Response } from 'express'

export default async function Me(req: Request, res: Response) {
	const { user } = req
	return res.success({
		message: App.Messages.Profile.Success.DetailSuccess(),
		items: user,
	})
}
