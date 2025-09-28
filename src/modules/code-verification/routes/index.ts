import '@core/declarations'
import { Request, Response, Router } from 'express'
import CodeVerificationController from '@modules/code-verification/controllers'
import { Wrap } from '@core/utils'
import { dynamic, DynamicRoutes } from '@middlewares/dynamic'

const codeVerificationController = new CodeVerificationController()
const router = Router()

router.get('/ping', (_req: Request, res: Response) => {
	return res.success()
})

router.post('/verify', Wrap(codeVerificationController.CodeVerification))
router.get('/:_codeVerification', Wrap(codeVerificationController.Get))
router.post(
	'/request',
	dynamic(DynamicRoutes.CodeVerificationRequest),
	Wrap(codeVerificationController.Request)
)

router.post('/resend-request/:_codeVerification', Wrap(codeVerificationController.ResendRequest))

export const codeVerificationRouter = router
