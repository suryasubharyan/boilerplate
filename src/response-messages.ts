import Config, { ConfigInterface } from '@config'
const config: ConfigInterface = Config()

export const Messages = {
	GeneralError: {
		InsufficientBalance: 'Insufficient Balance.',
		Unauthorized: 'Unauthorized!',
		SomethingWentWrong: 'Something went wrong.',
		BadRequest: 'Bad Request',
		AccountBlockedByAdmin: `Your account has been deactivated by the administrator, for more updates kindly contact ${config.AWS.SUPPORT_EMAIL}.`,
		SessionExpired: 'This session has expired!',
	},
	Helpers: {
		OTPHelper: {
			CodeSentSuccessFullyOverEmail:
				'This is your One Time Password: {{OTP}} from {{BrandName}}',
		},
		VerifyLinkHelper: {
			ForgotPasswordSMS: 'Link {{verifyLink}} from {{BrandName}}',
		},
		JWTHelper: {
			TokenExpired: 'Token Expired! Please signin again.',
		},
	},
	CodeVerification: {
		Success: {
			GetSuccess: 'Verification status fetched successfully.',
			CodeSent: 'Verification {{type}} has been sent to your {{to}}.',
			CodeVerified: 'Verification code verified successfully.',
			CodeResent: 'Verification {{type}} has been re-sent to your {{to}}.',
		},
		Error: {
			InvalidLink: 'Invalid Link!',
			UserNotExists: 'Sorry, we could not find your account.',
			ForgotPasswordSocialAccountNotAllowed:
				'Your account is created with Social Signup, please try with Social Login!',
			UserEmailUpdateInSocialAccountNotAllowed:
				"Your account is created with Social Signup, can't update email!",
			TwoFactorAuthenticationSettingsNotAvailable: 'Your account did not have 2FA Settings.',
			TwoFactorAuthenticationAlreadySet: '2FA Already Set.',
			RequiredDetailFor2FANotAvailable: 'Please set your {{detail}} first.',
			ResendLimitExceeded: 'You have exceeded the limits, please try again in some time.',
			ResendIsNotAvailable:
				'You are allowed to resend after {{resendShouldGetAllowedInSeconds}} seconds.',
			SessionExpired: 'This session has expired!',
			CodeVerificationExpired: 'Verification {{type}} has expired.',
			CodeVerificationFailed: 'Verification code is invalid.',
			IncorrectCode: 'The verification code password is incorrect. Please try again',
			MissingRecordToVerify: 'No record found for verification.',
			AccountBlockedDueToMultipleAttempts:
				'Your account has been blocked for {{timeLeftToUnblock}}. Please try again later.',
			DisabledAccount: 'Your account has been disabled.',
			EmailAlreadyInUse: 'Email is already in use.',
			PhoneAlreadyInUse: 'Phone is already in use.',
			InvalidPhoneNumber: 'Invalid phone number.',
			CodeVerificationNotFound: 'Code verification not found.',
		},
	},
	Auth: {
		Success: {
			AvailabilityCheck: 'Availability checked successfully.',
			SigninSuccessful: 'Signin successfully.',
			UserDetails: 'User details fetched successfully.',
			SignupSuccessful: 'Account created successfully.',
			ResetPasswordSuccessful: 'Password reset successfully.',
			SignOutSuccessful: 'Logged out successfully.',
			SigninSuccessfulProceedFor2FA: 'OTP sent successfully on phone number.',
			GoogleOauthLinkGeneratedSuccessful: 'Generated Google auth link',
			GoogleOauthLinkFailed: 'Failed to fetch data from  Google auth link',
			LinkedInOauthLinkGeneratedSuccessful: 'Generated Linkind auth link',
		},
		Error: {
			UserAlreadyExists: 'Account already exists.',
			UserNotFound: 'User details not found.',
			PreSignCodeVerificationFailed: 'Code verification failed.',
			AccountBlockedDueToMultipleAttempts:
				'Due to multiple wrong attempts you are not allowed to log in for {{timeLeftToUnblock}}.',
			PasswordSignInNotAllowedInSocialAccount:
				'Your account is created with Social Signup, please try with Social Login!',
			AccountNotFound: "User doesn't exist, Please Sign Up.",
			EmailAlreadyInUse: 'This email is already in use. Please Sign In.',
			PhoneAlreadyInUse: 'This phone number is already in use. Please Sign In.',
			InvalidCredentials: 'The entered credentials are wrong. Please try again.',
			AccountTerminated: 'Your account has been deleted.',
		},
	},
	Profile: {
		Success: {
			DetailSuccess: 'Profile details fetched successfully.',
			PasswordUpdated: 'Password updated successfully.',
			TwoFaEnabled: '2FA enabled successfully.',
			TwoFaDisabled: '2FA disabled successfully.',
			DetailsUpdated: 'Your profile details updated successfully.',
			AccountTerminated: 'Your account has been successfully deleted.',
			AccountDetailsUpdated: 'Account details updated successfully.',
		},
		Error: {
			IncorrectOldPassword: 'Old password is incorrect.',
			AccountAlreadyTerminated: 'This account is already terminated.',
			FileSizeExceeded: 'File size cannot be more than 2MB.',
			FileTypeNotAllowed: 'The uploaded {{type}} file type is not supported.',
		},
	},
}
