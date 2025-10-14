import Joi from 'joi'
import { RoomType } from '@models/room.model'
import objectIdValidatorHelper from '@helpers/object-id-validator.helper'

export const CreateRoomDTO = Joi.object({
	name: Joi.string().min(1).max(100).required().messages({
		'string.empty': 'Room name is required.',
		'string.min': 'Room name must be at least 1 character long.',
		'string.max': 'Room name cannot exceed 100 characters.',
	}),
	description: Joi.string().max(500).optional().messages({
		'string.max': 'Room description cannot exceed 500 characters.',
	}),
	type: Joi.string().valid(...Object.values(RoomType)).optional().messages({
		'any.only': 'Room type must be one of: PUBLIC, PRIVATE, DIRECT.',
	}),
	maxMembers: Joi.number().min(2).max(1000).optional().messages({
		'number.min': 'Maximum members must be at least 2.',
		'number.max': 'Maximum members cannot exceed 1000.',
	}),
	isEncrypted: Joi.boolean().optional(),
})

export const JoinRoomDTO = Joi.object({
	roomId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'Room ID is required.',
		}),
})

export const LeaveRoomDTO = Joi.object({
	roomId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'Room ID is required.',
		}),
})

export const InviteUserDTO = Joi.object({
	roomId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'Room ID is required.',
		}),
	userId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'User ID is required.',
		}),
	expiresInHours: Joi.number().min(1).max(168).optional().messages({
		'number.min': 'Expiration must be at least 1 hour.',
		'number.max': 'Expiration cannot exceed 168 hours (7 days).',
	}),
})

export const AcceptInvitationDTO = Joi.object({
	roomId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'Room ID is required.',
		}),
})

export const DeclineInvitationDTO = Joi.object({
	roomId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'Room ID is required.',
		}),
})

export const UpdateRoomDTO = Joi.object({
	name: Joi.string().min(1).max(100).optional().messages({
		'string.min': 'Room name must be at least 1 character long.',
		'string.max': 'Room name cannot exceed 100 characters.',
	}),
	description: Joi.string().max(500).optional().messages({
		'string.max': 'Room description cannot exceed 500 characters.',
	}),
	maxMembers: Joi.number().min(2).max(1000).optional().messages({
		'number.min': 'Maximum members must be at least 2.',
		'number.max': 'Maximum members cannot exceed 1000.',
	}),
	isEncrypted: Joi.boolean().optional(),
})

export const RemoveMemberDTO = Joi.object({
	roomId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'Room ID is required.',
		}),
	userId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'User ID is required.',
		}),
})

export const ChangeMemberRoleDTO = Joi.object({
	roomId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'Room ID is required.',
		}),
	userId: Joi.string()
		.required()
		.custom(objectIdValidatorHelper.Validate, 'ObjectId Validation')
		.messages({
			'string.empty': 'User ID is required.',
		}),
	role: Joi.string().valid('ADMIN', 'MODERATOR', 'MEMBER').required().messages({
		'any.only': 'Role must be one of: ADMIN, MODERATOR, or MEMBER.',
	}),
})

export const GetRoomMembersDTO = Joi.object({
	startIndex: Joi.number().min(0).optional().messages({
		'number.min': 'Start index must be 0 or greater.',
	}),
	itemsPerPage: Joi.number().min(1).max(100).optional().messages({
		'number.min': 'Items per page must be at least 1.',
		'number.max': 'Items per page cannot exceed 100.',
	}),
})

export const GetUserRoomsDTO = Joi.object({
	startIndex: Joi.number().min(0).optional().messages({
		'number.min': 'Start index must be 0 or greater.',
	}),
	itemsPerPage: Joi.number().min(1).max(100).optional().messages({
		'number.min': 'Items per page must be at least 1.',
		'number.max': 'Items per page cannot exceed 100.',
	}),
	type: Joi.string().valid(...Object.values(RoomType)).optional().messages({
		'any.only': 'Room type must be one of: PUBLIC, PRIVATE, DIRECT.',
	}),
})

export const GetRoomInvitationsDTO = Joi.object({
	startIndex: Joi.number().min(0).optional().messages({
		'number.min': 'Start index must be 0 or greater.',
	}),
	itemsPerPage: Joi.number().min(1).max(100).optional().messages({
		'number.min': 'Items per page must be at least 1.',
		'number.max': 'Items per page cannot exceed 100.',
	}),
	status: Joi.string().valid('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED').optional().messages({
		'any.only': 'Status must be one of: PENDING, ACCEPTED, DECLINED, EXPIRED.',
	}),
})
