import AvailabilityCheck from './availability-check'
import GetUserDetails from './get-user'
import ResetPassword from './reset-password'
import SignIn from './sign-in'
import SignOut from './sign-out'
import Signup from './sign-up'

export default class AuthController {
	AvailabilityCheck = AvailabilityCheck
	GetUserDetails = GetUserDetails
	Signup = Signup
	SignIn = SignIn
	ResetPassword = ResetPassword
	SignOut = SignOut
}
