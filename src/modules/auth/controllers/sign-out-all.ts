import '@core/declarations'
import { Request, Response } from 'express'

export default async function SignOutAll(_req: Request, res: Response) {
    const { user } = res
    const existingUser = await App.Models.User.findOne({ _id: user._id, isActive: true })
    if (!existingUser) {
        return res.forbidden({ message: App.Messages.Auth.Error.UserNotExists() })
    }

    existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1
    existingUser.registeredDevices = []
    await existingUser.save()

    return res.success({ message: 'Signed out from all devices.' })
}
