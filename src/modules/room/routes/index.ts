import '@core/declarations'
import { Router } from 'express'
import RoomController from '../controllers'

const router = Router()

// Room CRUD operations
router.post('/create', RoomController.CreateRoom)
router.get('/user-rooms', RoomController.GetUserRooms)
router.get('/invitations', RoomController.GetRoomInvitations)
router.get('/:roomId', RoomController.GetRoom)
router.put('/:roomId', RoomController.UpdateRoom)
router.delete('/:roomId', RoomController.DeleteRoom)

// Room membership operations
router.post('/join', RoomController.JoinRoom)
router.post('/leave', RoomController.LeaveRoom)
router.get('/:roomId/members', RoomController.GetRoomMembers)
router.post('/remove-member', RoomController.RemoveMember)
router.post('/change-member-role', RoomController.ChangeMemberRole)

// Room invitation operations
router.post('/invite', RoomController.InviteUser)
router.post('/accept-invitation', RoomController.AcceptInvitation)
router.post('/decline-invitation', RoomController.DeclineInvitation)

export default router
