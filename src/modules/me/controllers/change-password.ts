import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import bcrypt from 'bcrypt'
import { ChangePasswordDTO } from '../dtos/change-password.dto'

export default async function ChangePassword(req: Request, res: Response) {
	const errors = await requestValidator(ChangePasswordDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { oldPassword, newPassword, logoutOtherDevices } = req.body
	const { user } = req

	// Fetch user with password field (it's not selected by default)
	const existingUser = await App.Models.User.findById(user._id).select('+password')

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	// Check if account is deleted
	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated(),
		})
	}

	// Verify old password
	const isOldPasswordValid = await bcrypt.compare(oldPassword, existingUser.password)
	if (!isOldPasswordValid) {
		return res.forbidden({ message: App.Messages.Auth.Error.InvalidCredentials })
	}

	// Check if new password is same as old password
	const isSamePassword = await bcrypt.compare(newPassword, existingUser.password)
	if (isSamePassword) {
		return res.badRequest({
			message: 'New password cannot be the same as your current password.',
		})
	}

	// Update password (will be hashed by pre-save hook)
	existingUser.password = newPassword

	// Optionally logout other devices by incrementing token version
	if (logoutOtherDevices) {
		existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1
	}

	await existingUser.save()

	// All Done
	return res.success({
		message: 'Password changed successfully.',
	})
}

