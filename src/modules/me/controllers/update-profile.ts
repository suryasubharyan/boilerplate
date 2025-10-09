import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import { UpdateAccountDetailsDTO } from '../dtos/update-account-details.dto'

export default async function UpdateProfile(req: Request, res: Response) {
	const errors = await requestValidator(UpdateAccountDetailsDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { firstName, lastName, linkedInProfileUrl, profileImage, resume, removeProfileImage } =
		req.body
	const { user } = req

	// Fetch user to update
	const existingUser = await App.Models.User.findById(user._id)

	if (!existingUser) {
		return res.notFound({ message: App.Messages.Auth.Error.AccountNotFound })
	}

	// Check if account is deleted
	if (existingUser.accountMetadata.isDeleted) {
		return res.forbidden({
			message: App.Messages.Auth.Error.AccountTerminated,
		})
	}

	// Track if any changes were made
	let userChanged = false
	let profileChanged = false

	// Update user fields only if different
	if (firstName !== undefined && existingUser.firstName !== firstName) {
		existingUser.firstName = firstName
		userChanged = true
	}
	if (lastName !== undefined && existingUser.lastName !== lastName) {
		existingUser.lastName = lastName
		userChanged = true
	}

	// Fetch or create user profile
	let userProfile = await App.Models.UserProfile.findOne({ _user: user._id })

	if (!userProfile) {
		userProfile = new App.Models.UserProfile({ _user: user._id })
		profileChanged = true // New profile will be created
	}

	// Update profile fields only if different
	if (linkedInProfileUrl !== undefined && userProfile.linkedInProfileUrl !== linkedInProfileUrl) {
		userProfile.linkedInProfileUrl = linkedInProfileUrl
		profileChanged = true
	}
	if (profileImage !== undefined && userProfile.profileImage !== profileImage) {
		userProfile.profileImage = profileImage
		profileChanged = true
	}
	if (resume !== undefined && userProfile.resume !== resume) {
		userProfile.resume = resume
		profileChanged = true
	}

	// Handle profile image removal
	if (removeProfileImage === true && userProfile.profileImage !== undefined) {
		userProfile.profileImage = undefined
		profileChanged = true
	}

	// Check if any changes were made
	if (!userChanged && !profileChanged) {
		return res.success({
			message: 'No changes detected. Profile is already up to date.',
			items: {
				user: existingUser,
				profile: userProfile,
			},
		})
	}

	// Save only if changes were made
	const savePromises = []
	if (userChanged) savePromises.push(existingUser.save())
	if (profileChanged) savePromises.push(userProfile.save())

	await Promise.all(savePromises)

	// Fetch updated user with profile
	const updatedUser = await App.Models.User.findById(user._id)
	const updatedProfile = await App.Models.UserProfile.findOne({ _user: user._id })

	// All Done
	return res.success({
		message: 'Profile updated successfully.',
		items: {
			user: updatedUser,
			profile: updatedProfile,
		},
	})
}

