import { Router } from 'express'
import MeController from '../controllers'
import { Wrap } from '@core/utils'

const router = Router()

const controller = new MeController()

router.get('/', Wrap(controller.Me))

router.post('/terminate-account', Wrap(controller.TerminateAccount))

export const meRouter = router
