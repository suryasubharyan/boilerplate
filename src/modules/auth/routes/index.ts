import { Router } from 'express'
import { Wrap } from '@core/utils'
import AuthController from '../controllers'
import { authorize } from '@middlewares/authorizer'

const router = Router()
const controller = new AuthController()

router.get('/signup.availability-check', Wrap(controller.AvailabilityCheck))
router.get('/user-details', Wrap(controller.GetUserDetails))

router.post('/signin', Wrap(controller.SignIn))
router.post('/signup', Wrap(controller.Signup))
router.post('/reset-password', Wrap(controller.ResetPassword))
router.post('/refresh-token', Wrap(controller.RefreshToken))
router.post('/verify-2fa-totp', Wrap(controller.Verify2FATotp))
router.post('/sign-out', authorize, Wrap(controller.SignOut))
router.post('/sign-out-all', authorize, Wrap(controller.SignOutAll))

export default router
