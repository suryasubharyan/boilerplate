import '@core/declarations'
import requestValidator from '@helpers/request-validator.helper'
import { Request, Response } from 'express'
import { CodeVerificationPurpose, CodeVerificationStatus } from '@models/code-verification'
import Dayjs from 'dayjs'
import AuthAfterEffectsHelper from '@helpers/auth-after-effects.helper'
import { SignupDTO } from '../dto/sign-up.dto'
import { MailHelper } from '@helpers/email.helper'
import otpHelper from '@helpers/otp.helper'
import { GenerateRandomNumberOfLength } from '@core/utils'

export default async function Signup(req: Request, res: Response) {
	const errors = await requestValidator(SignupDTO, req.body)
	if (errors) {
		return res.unprocessableEntity({ errors })
	}

	const { _codeVerification, firstName, lastName, password, location, _designation } = req.body

    let email = req.body?.email
    let phone = req.body?.phone
    let countryCode = req.body?.countryCode
    let existingUserCount = null

    const requirePreSignup = App.Config.AUTH?.REQUIRE_PRE_SIGNUP_VERIFICATION === true

    let codeVerification: any = null
    if (_codeVerification) {
        // Validate provided pre-signup verification record
        codeVerification = await App.Models.CodeVerification.findOne({
            _id: _codeVerification,
            status: CodeVerificationStatus.Passed,
            purpose: CodeVerificationPurpose.PRE_SIGNUP,
            isActive: true,
        }).sort({ createdAt: -1 })

        if (!codeVerification) {
            return res.badRequest({
                message: App.Messages.Auth.Error.PreSignCodeVerificationFailed(),
            })
        }

        const { EXPIRATION_TIME_FOR_PASSED_CODE, EXPIRATION_TIME_FOR_PASSED_CODE_UNIT } =
            App.Config.CODE_VERIFICATION
        if (
            Dayjs(codeVerification.verificationPerformedAt).isBefore(
                Dayjs().subtract(
                    EXPIRATION_TIME_FOR_PASSED_CODE,
                    EXPIRATION_TIME_FOR_PASSED_CODE_UNIT
                )
            )
        ) {
            codeVerification.isActive = false
            await codeVerification.save()
            return res.forbidden({ message: App.Messages.GeneralError.SessionExpired() })
        }

        if (codeVerification.email) {
            email = codeVerification.email
        } else if (codeVerification.phone && codeVerification.countryCode) {
            phone = codeVerification.phone
            countryCode = codeVerification.countryCode
        } else {
            throw Error(App.Messages.GeneralError.SomethingWentWrong())
        }
    } else if (requirePreSignup) {
        // If required but not provided
        return res.badRequest({
            message: App.Messages.Auth.Error.PreSignCodeVerificationFailed(),
        })
    }

	// Check if { Email } is available
	if (email) {
		existingUserCount = await App.Models.User.findByEmail(email.trim().toLowerCase())
		if (existingUserCount) {
			return res.conflict({
				message: App.Messages.Auth.Error.EmailAlreadyInUse(),
			})
		}
	}

	// Check if { Phone } is available
	if (phone && countryCode) {
		existingUserCount = await App.Models.User.findByPhone(phone.trim(), countryCode.trim())
		if (existingUserCount) {
			return res.conflict({
				message: App.Messages.Auth.Error.PhoneAlreadyInUse(),
			})
		}
	}

	// Create User Document
	const user = new App.Models.User(
		_.omitBy(
			{
				firstName,
				lastName,
				email,
				phone,
				countryCode,
				password,
			},
			_.isNil
		)
	)

    if (codeVerification) {
        codeVerification.isActive = false
    }

	// Create User Profile Doc
	const userProfile = new App.Models.UserProfile({ _user: user._id, _designation, location })

    await Promise.all([
        user.save(),
        codeVerification ? codeVerification.save() : Promise.resolve(),
        userProfile.save(),
    ])

    // If pre-signup verification was skipped, send post-signup verification code
    if (!requirePreSignup && !_codeVerification) {
        const OTP = GenerateRandomNumberOfLength(4)
        const postSignupCode = await App.Models.CodeVerification.create(
            _.omitBy(
                {
                    email,
                    phone,
                    countryCode,
                    purpose: CodeVerificationPurpose.PRE_SIGNUP,
                    internalOTP: { code: OTP.toString() },
                },
                _.isNil
            )
        )

        if (postSignupCode.email) {
            await MailHelper.send({
                to: postSignupCode.email,
                subject: 'Verify Your Email',
                templateName: 'verify-email',
                data: { OTP },
            })
        }
        if (postSignupCode.phone && postSignupCode.countryCode) {
            await otpHelper.SendCodeToMobile(
                postSignupCode.countryCode + postSignupCode.phone,
                App.Messages.Helpers.OTPHelper.CodeSentSuccessFullyOverEmail({
                    OTP,
                    BrandName: App.Config.AWS.BRAND_NAME,
                })
            )
        }
    }

    // All Done (no token at signup)
    return res.created({
        message: App.Messages.Auth.Success.SignupSuccessful(),
        item: {},
    })
}
