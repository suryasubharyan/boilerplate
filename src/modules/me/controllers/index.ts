import Me from './get'
import TerminateAccount from './terminate-account'
import ChangePassword from './change-password'
import UpdateProfile from './update-profile'
import UpdateEmail from './update-email'
import UpdatePhone from './update-phone'
import Enable2FA from './enable-2fa'
import Disable2FA from './disable-2fa'
import Get2FAStatus from './get-2fa-status'
import SetupAuthenticator from './setup-authenticator'
import VerifyAuthenticator from './verify-authenticator'

export default class MeController {
	Me = Me
	TerminateAccount = TerminateAccount
	ChangePassword = ChangePassword
	UpdateProfile = UpdateProfile
	UpdateEmail = UpdateEmail
	UpdatePhone = UpdatePhone
	Enable2FA = Enable2FA
	Disable2FA = Disable2FA
	Get2FAStatus = Get2FAStatus
	SetupAuthenticator = SetupAuthenticator
	VerifyAuthenticator = VerifyAuthenticator
}
