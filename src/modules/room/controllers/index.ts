import '@core/declarations'
import { Request, Response } from 'express'
import requestValidator from '@helpers/request-validator.helper'
import Paginator from '@helpers/pagination.helper'
import _ from 'lodash'
import {
	CreateRoomDTO,
	JoinRoomDTO,
	LeaveRoomDTO,
	InviteUserDTO,
	AcceptInvitationDTO,
	DeclineInvitationDTO,
	UpdateRoomDTO,
	RemoveMemberDTO,
	ChangeMemberRoleDTO,
	GetRoomMembersDTO,
	GetUserRoomsDTO,
	GetRoomInvitationsDTO,
} from '../dtos/create-room.dto'

export default class RoomController {
	// Create a new room
	static async CreateRoom(req: Request, res: Response) {
		const errors = await requestValidator(CreateRoomDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { name, description, type, maxMembers, isEncrypted } = req.body
		const { user } = req

		try {
			const room = new App.Models.Room({
				name,
				description,
				type: type || 'PRIVATE',
				maxMembers: maxMembers || 100,
				isEncrypted: isEncrypted || false,
				createdBy: user._id,
				members: [{
					userId: user._id,
					role: 'ADMIN',
					joinedAt: new Date(),
					isActive: true,
				}],
			})

			await room.save()

			const populatedRoom = await App.Models.Room.findRoomById(room._id)

			return res.created({
				message: 'Room created successfully.',
				item: populatedRoom,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to create room.',
			})
		}
	}

	// Join a room
	static async JoinRoom(req: Request, res: Response) {
		const errors = await requestValidator(JoinRoomDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId } = req.body
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (room.status !== 'ACTIVE') {
				return res.badRequest({
					message: 'Room is not active.',
				})
			}

			if (room.isMember(user._id)) {
				return res.conflict({
					message: 'You are already a member of this room.',
				})
			}

			if (room.members.length >= room.maxMembers) {
				return res.badRequest({
					message: 'Room is at maximum capacity.',
				})
			}

			room.addMember(user._id)
			await room.save()

			const populatedRoom = await App.Models.Room.findRoomById(room._id)

			return res.success({
				message: 'Successfully joined the room.',
				item: populatedRoom,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to join room.',
			})
		}
	}

	// Leave a room
	static async LeaveRoom(req: Request, res: Response) {
		const errors = await requestValidator(LeaveRoomDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId } = req.body
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (!room.isMember(user._id)) {
				return res.badRequest({
					message: 'You are not a member of this room.',
				})
			}

			// Check if user is the creator
			if (room.createdBy.toString() === user._id.toString()) {
				return res.badRequest({
					message: 'Room creator cannot leave the room. Transfer ownership or delete the room instead.',
				})
			}

			room.removeMember(user._id)
			await room.save()

			return res.success({
				message: 'Successfully left the room.',
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to leave room.',
			})
		}
	}

	// Invite user to room
	static async InviteUser(req: Request, res: Response) {
		const errors = await requestValidator(InviteUserDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId, userId, expiresInHours } = req.body
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (!room.isAdmin(user._id)) {
				return res.forbidden({
					message: 'Only room admins can invite users.',
				})
			}

			const invitedUser = await App.Models.User.findById(userId)
			if (!invitedUser) {
				return res.notFound({
					message: 'User not found.',
				})
			}

			if (room.isMember(userId)) {
				return res.conflict({
					message: 'User is already a member of this room.',
				})
			}

			const invitation = room.addInvitation(userId, user._id, expiresInHours || 24)
			await room.save()

			const populatedRoom = await App.Models.Room.findRoomById(room._id)

			return res.success({
				message: 'User invited successfully.',
				item: populatedRoom,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to invite user.',
			})
		}
	}

	// Accept room invitation
	static async AcceptInvitation(req: Request, res: Response) {
		const errors = await requestValidator(AcceptInvitationDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId } = req.body
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			const invitation = room.acceptInvitation(user._id)
			if (!invitation) {
				return res.badRequest({
					message: 'No valid invitation found for this room.',
				})
			}

			await room.save()

			const populatedRoom = await App.Models.Room.findRoomById(room._id)

			return res.success({
				message: 'Invitation accepted successfully.',
				item: populatedRoom,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to accept invitation.',
			})
		}
	}

	// Decline room invitation
	static async DeclineInvitation(req: Request, res: Response) {
		const errors = await requestValidator(DeclineInvitationDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId } = req.body
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			const invitation = room.declineInvitation(user._id)
			if (!invitation) {
				return res.badRequest({
					message: 'No pending invitation found for this room.',
				})
			}

			await room.save()

			return res.success({
				message: 'Invitation declined successfully.',
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to decline invitation.',
			})
		}
	}

	// Update room details
	static async UpdateRoom(req: Request, res: Response) {
		const errors = await requestValidator(UpdateRoomDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId } = req.params
		const updateData = _.omitBy(req.body, _.isNil)
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (!room.isAdmin(user._id)) {
				return res.forbidden({
					message: 'Only room admins can update room details.',
				})
			}

			Object.assign(room, updateData)
			room._updatedBy = user._id
			await room.save()

			const populatedRoom = await App.Models.Room.findRoomById(room._id)

			return res.success({
				message: 'Room updated successfully.',
				item: populatedRoom,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to update room.',
			})
		}
	}

	// Remove member from room
	static async RemoveMember(req: Request, res: Response) {
		const errors = await requestValidator(RemoveMemberDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId, userId } = req.body
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (!room.isAdmin(user._id)) {
				return res.forbidden({
					message: 'Only room admins can remove members.',
				})
			}

			if (userId === room.createdBy.toString()) {
				return res.badRequest({
					message: 'Cannot remove the room creator.',
				})
			}

			if (!room.isMember(userId)) {
				return res.badRequest({
					message: 'User is not a member of this room.',
				})
			}

			room.removeMember(userId)
			await room.save()

			const populatedRoom = await App.Models.Room.findRoomById(room._id)

			return res.success({
				message: 'Member removed successfully.',
				item: populatedRoom,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to remove member.',
			})
		}
	}

	// Change member role
	static async ChangeMemberRole(req: Request, res: Response) {
		const errors = await requestValidator(ChangeMemberRoleDTO, req.body)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId, userId, role } = req.body
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (!room.isAdmin(user._id)) {
				return res.forbidden({
					message: 'Only room admins can change member roles.',
				})
			}

			const member = room.members.find(
				(member: any) => member.userId.toString() === userId.toString()
			)

			if (!member) {
				return res.badRequest({
					message: 'User is not a member of this room.',
				})
			}

			member.role = role
			await room.save()

			const populatedRoom = await App.Models.Room.findRoomById(room._id)

			return res.success({
				message: 'Member role updated successfully.',
				item: populatedRoom,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to change member role.',
			})
		}
	}

	// Get room details
	static async GetRoom(req: Request, res: Response) {
		const { roomId } = req.params
		const { user } = req

		try {
			const room = await App.Models.Room.findRoomById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (!room.isMember(user._id)) {
				return res.forbidden({
					message: 'You are not a member of this room.',
				})
			}

			return res.success({
				item: room,
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to get room details.',
			})
		}
	}

	// Get room members
	static async GetRoomMembers(req: Request, res: Response) {
		const errors = await requestValidator(GetRoomMembersDTO, req.query)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { roomId } = req.params
		const { startIndex = 0, itemsPerPage = 20 } = req.query
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (!room.isMember(user._id)) {
				return res.forbidden({
					message: 'You are not a member of this room.',
				})
			}

			const options = {
				startIndex: +startIndex,
				itemsPerPage: +itemsPerPage,
				query: { _id: roomId },
				projection: { members: 1 },
				model: App.Models.Room,
			}

			const result = await Paginator.Paginate(options)

			return res.success({ ...result })
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to get room members.',
			})
		}
	}

	// Get user's rooms
	static async GetUserRooms(req: Request, res: Response) {
		const errors = await requestValidator(GetUserRoomsDTO, req.query)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { startIndex = 0, itemsPerPage = 20, type } = req.query
		const { user } = req

		try {
			const query: any = {
				'members.userId': user._id,
				'members.isActive': true,
				status: 'ACTIVE',
			}

			if (type) {
				query.type = type
			}

			const options = {
				startIndex: +startIndex,
				itemsPerPage: +itemsPerPage,
				query,
				model: App.Models.Room,
			}

			const result = await Paginator.Paginate(options)

			return res.success({ ...result })
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to get user rooms.',
			})
		}
	}

	// Get room invitations
	static async GetRoomInvitations(req: Request, res: Response) {
		const errors = await requestValidator(GetRoomInvitationsDTO, req.query)
		if (errors) {
			return res.unprocessableEntity({ errors })
		}

		const { startIndex = 0, itemsPerPage = 20, status } = req.query
		const { user } = req

		try {
			const query: any = {
				'invitations.userId': user._id,
			}

			if (status) {
				query['invitations.status'] = status
			}

			const options = {
				startIndex: +startIndex,
				itemsPerPage: +itemsPerPage,
				query,
				model: App.Models.Room,
			}

			const result = await Paginator.Paginate(options)

			return res.success({ ...result })
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to get room invitations.',
			})
		}
	}

	// Delete room
	static async DeleteRoom(req: Request, res: Response) {
		const { roomId } = req.params
		const { user } = req

		try {
			const room = await App.Models.Room.findById(roomId)
			if (!room) {
				return res.notFound({
					message: 'Room not found.',
				})
			}

			if (room.createdBy.toString() !== user._id.toString()) {
				return res.forbidden({
					message: 'Only the room creator can delete the room.',
				})
			}

			room.status = 'DELETED'
			room._updatedBy = user._id
			await room.save()

			return res.success({
				message: 'Room deleted successfully.',
			})
		} catch (error) {
			Logger.error(error)
			return res.internalServerError({
				message: 'Failed to delete room.',
			})
		}
	}
}
