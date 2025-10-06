import '@core/declarations'
import { Schema, model as Model } from 'mongoose'
import { Models } from '@core/constants/database-models'
import { IBaseModel } from '@core/database'

const ObjectId = Schema.Types.ObjectId

export enum RoomType {
	PUBLIC = 'PUBLIC',
	PRIVATE = 'PRIVATE',
	DIRECT = 'DIRECT',
}

export enum RoomStatus {
	ACTIVE = 'ACTIVE',
	ARCHIVED = 'ARCHIVED',
	DELETED = 'DELETED',
}

export interface IRoomMember {
	userId: any
	role: 'ADMIN' | 'MEMBER'
	joinedAt: Date
	isActive: boolean
}

export interface IRoomInvitation {
	userId: any
	invitedBy: any
	invitedAt: Date
	status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
	expiresAt: Date
}

export interface IRoom extends IBaseModel {
	name: string
	description?: string
	type: RoomType
	status: RoomStatus
	members: IRoomMember[]
	invitations: IRoomInvitation[]
	createdBy: any
	maxMembers?: number
	isEncrypted?: boolean
	metadata?: {
		lastMessageAt?: Date
		lastMessageBy?: any
		messageCount?: number
	}
}

const roomMemberSchema = new Schema({
	userId: { type: ObjectId, ref: Models.User, required: true },
	role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
	joinedAt: { type: Date, default: Date.now },
	isActive: { type: Boolean, default: true },
})

const roomInvitationSchema = new Schema({
	userId: { type: ObjectId, ref: Models.User, required: true },
	invitedBy: { type: ObjectId, ref: Models.User, required: true },
	invitedAt: { type: Date, default: Date.now },
	status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'], default: 'PENDING' },
	expiresAt: { type: Date, required: true },
})

const roomSchema = new Schema({
	name: { type: String, required: true, trim: true },
	description: { type: String, trim: true },
	type: { type: String, default: 'PRIVATE' },
	status: { type: String, default: 'ACTIVE' },
	members: [roomMemberSchema],
	invitations: [roomInvitationSchema],
	createdBy: { type: ObjectId, ref: Models.User, required: true },
	maxMembers: { type: Number, default: 100 },
	isEncrypted: { type: Boolean, default: false },
	lastMessageAt: Date,
	lastMessageBy: { type: ObjectId, ref: Models.User },
	messageCount: { type: Number, default: 0 },
	isActive: { type: Boolean, default: true },
	_updatedBy: { type: ObjectId, ref: Models.User },
} as any)

// Set schema options
roomSchema.set('autoIndex', true)
roomSchema.set('versionKey', false)
roomSchema.set('timestamps', true)

// Indexes for better performance
roomSchema.index({ 'members.userId': 1 })
roomSchema.index({ 'invitations.userId': 1 })
roomSchema.index({ createdBy: 1 })
roomSchema.index({ status: 1 })
roomSchema.index({ type: 1 })

// Static methods
roomSchema.statics.findByUserId = function(userId: any) {
	return this.find({
		'members.userId': userId,
		'members.isActive': true,
		status: RoomStatus.ACTIVE,
	}).populate('members.userId', 'firstName lastName email')
}

roomSchema.statics.findRoomById = function(roomId: any) {
	return this.findById(roomId)
		.populate('members.userId', 'firstName lastName email')
		.populate('createdBy', 'firstName lastName email')
		.populate('invitations.userId', 'firstName lastName email')
		.populate('invitations.invitedBy', 'firstName lastName email')
}

roomSchema.statics.findUserRooms = function(userId: any, options: any = {}) {
	const { startIndex = 0, itemsPerPage = 20 } = options
	return this.find({
		'members.userId': userId,
		'members.isActive': true,
		status: RoomStatus.ACTIVE,
	})
		.populate('members.userId', 'firstName lastName email')
		.populate('createdBy', 'firstName lastName email')
		.populate('metadata.lastMessageBy', 'firstName lastName')
		.sort({ 'metadata.lastMessageAt': -1 })
		.skip(startIndex)
		.limit(itemsPerPage)
}

// Instance methods
roomSchema.methods.addMember = function(userId: any, role: 'ADMIN' | 'MEMBER' = 'MEMBER') {
	const existingMember = this.members.find(
		(member: IRoomMember) => member.userId.toString() === userId.toString()
	)
	
	if (existingMember) {
		if (!existingMember.isActive) {
			existingMember.isActive = true
			existingMember.joinedAt = new Date()
		}
		return existingMember
	}
	
	const newMember: IRoomMember = {
		userId,
		role,
		joinedAt: new Date(),
		isActive: true,
	}
	
	this.members.push(newMember)
	return newMember
}

roomSchema.methods.removeMember = function(userId: any) {
	const member = this.members.find(
		(member: IRoomMember) => member.userId.toString() === userId.toString()
	)
	
	if (member) {
		member.isActive = false
	}
	
	return member
}

roomSchema.methods.isMember = function(userId: any) {
	return this.members.some(
		(member: IRoomMember) => 
			member.userId.toString() === userId.toString() && member.isActive
	)
}

roomSchema.methods.isAdmin = function(userId: any) {
	return this.members.some(
		(member: IRoomMember) => 
			member.userId.toString() === userId.toString() && 
			member.isActive && 
			member.role === 'ADMIN'
	)
}

roomSchema.methods.addInvitation = function(userId: any, invitedBy: any, expiresInHours: number = 24) {
	const existingInvitation = this.invitations.find(
		(inv: IRoomInvitation) => 
			inv.userId.toString() === userId.toString() && 
			inv.status === 'PENDING'
	)
	
	if (existingInvitation) {
		existingInvitation.expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
		return existingInvitation
	}
	
	const newInvitation: IRoomInvitation = {
		userId,
		invitedBy,
		invitedAt: new Date(),
		status: 'PENDING',
		expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
	}
	
	this.invitations.push(newInvitation)
	return newInvitation
}

roomSchema.methods.acceptInvitation = function(userId: any) {
	const invitation = this.invitations.find(
		(inv: IRoomInvitation) => 
			inv.userId.toString() === userId.toString() && 
			inv.status === 'PENDING' &&
			inv.expiresAt > new Date()
	)
	
	if (invitation) {
		invitation.status = 'ACCEPTED'
		this.addMember(userId)
		return invitation
	}
	
	return null
}

roomSchema.methods.declineInvitation = function(userId: any) {
	const invitation = this.invitations.find(
		(inv: IRoomInvitation) => 
			inv.userId.toString() === userId.toString() && 
			inv.status === 'PENDING'
	)
	
	if (invitation) {
		invitation.status = 'DECLINED'
		return invitation
	}
	
	return null
}

export default Model<IRoom>(Models.Room, roomSchema)