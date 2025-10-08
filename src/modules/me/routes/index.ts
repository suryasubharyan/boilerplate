import { Router } from 'express'
import MeController from '../controllers'
import { Wrap } from '@core/utils'

const router = Router()

const controller = new MeController()

router.get('/', Wrap(controller.Me))
router.get('/2fa-status', Wrap(controller.Get2FAStatus))

router.post('/terminate-account', Wrap(controller.TerminateAccount))
router.post('/change-password', Wrap(controller.ChangePassword))
router.patch('/update-profile', Wrap(controller.UpdateProfile))
router.post('/update-email', Wrap(controller.UpdateEmail))
router.post('/update-phone', Wrap(controller.UpdatePhone))
router.post('/enable-2fa', Wrap(controller.Enable2FA))
router.post('/disable-2fa', Wrap(controller.Disable2FA))
router.post('/setup-authenticator', Wrap(controller.SetupAuthenticator))
router.post('/verify-authenticator', Wrap(controller.VerifyAuthenticator))

export const meRouter = router
