import Config, { ConfigInterface } from '@config'
import { Logger } from './logger'
import { GenerateCallableMessages } from './utils'
import path from 'path'
import _ from 'lodash'
const config: ConfigInterface = Config()

import { Messages } from '../response-messages'

// Database Models
import { ServerStatModel } from '@models/server-stat'
import { UserModel } from '@models/user.model'
import { CodeVerificationModel } from '@models/code-verification'
import { NotificationModel } from '@models/notification'

// Export Global Variables
export const Global: any = global
Global._ = _
Global.Logger = Logger
Global.App = {
	EXTENSION_ECOSYSTEM: path.extname(__filename) === '.js' ? 'js' : 'ts',
	Http: {
		app: null,
	},
	Config: config,
	Messages: GenerateCallableMessages(Messages),
	Models: {
		ServerStat: ServerStatModel,
		CodeVerification: CodeVerificationModel,
		User: UserModel,
		Notification: NotificationModel,
	},
}
