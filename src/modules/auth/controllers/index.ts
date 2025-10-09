import AvailabilityCheck from './availability-check'
import GetUserDetails from './get-user'
import ResetPassword from './reset-password'
import SignIn from './sign-in'
import SignOut from './sign-out'
import SignOutAll from './sign-out-all'
import Signup from './sign-up'
import RefreshToken from './refresh-token'
import Verify2FATotp from './verify-2fa-totp'

export default class AuthController {
	AvailabilityCheck = AvailabilityCheck
	GetUserDetails = GetUserDetails
	Signup = Signup
	SignIn = SignIn
	ResetPassword = ResetPassword
	SignOut = SignOut
	SignOutAll = SignOutAll
	RefreshToken = RefreshToken
	Verify2FATotp = Verify2FATotp
}
