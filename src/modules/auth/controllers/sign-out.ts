import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { SignOutDTO } from '../dto/sign-out.dto'
import { RemoveFCMToken } from '@core/utils'

export default async function SignOut(req: Request, res: Response) {
	const errors = await requestValidator(SignOutDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { user } = req
	const { fcmToken, deviceType } = req.body

	const existingUser = await App.Models.User.findOne({
		_id: user._id,
		isActive: true,
	})

	if (!existingUser) {
		return res.forbidden({
			message: App.Messages.Auth.Error.UserNotExists,
		})
	}

	const registeredDevice = existingUser?.registeredDevices

	if (registeredDevice) {
		const newRegisteredDevices = RemoveFCMToken(
			existingUser?.registeredDevices,
			fcmToken,
			deviceType
		)
		existingUser.registeredDevices = newRegisteredDevices
	}

    await existingUser.save()

	// All Done
	return res.success({
		message: App.Messages.Auth.Success.SignOutSuccessful,
	})
}
