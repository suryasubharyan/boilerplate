import '@core/declarations'
import _CodeVerification from './code-verification'
import _Get from './get'
import _Request from './request'
import _ResendRequest from './resend-request'

export default class AuthController {
	CodeVerification = _CodeVerification

	Get = _Get

	Request = _Request

	ResendRequest = _ResendRequest
}
