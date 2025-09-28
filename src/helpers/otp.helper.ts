import '@core/declarations'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

// Load credentials from the environment file
const ID = App.Config.AWS.ACCESS_KEY_ID
const SECRET = App.Config.AWS.SECRET_ACCESS_KEY
const REGION = App.Config.AWS.REGION

const snsClientInstance = new SNSClient({
	region: REGION,
	credentials: {
		accessKeyId: ID,
		secretAccessKey: SECRET,
	},
})

export class OTP {
	async SendCodeToMobile(phone: string, content: string) {
		const params = {
			Message: content,
			PhoneNumber: phone,
		}

		const command = new PublishCommand(params)

		const data = await snsClientInstance.send(command)
		Logger.info(`SMS delivered successfully | MessageID: ${data.MessageId}`)
		return data
	}
	async VerifyCode(payload: any, code: string) {
		const verifyCodeResponse = null
		if (payload.existingCodeVerification.internalOTP) {
			const outputResponse = {
				VerificationResponse: {
					Valid: false,
				},
			}

			outputResponse.VerificationResponse.Valid = false
			const existingCodeVerification = payload.existingCodeVerification
			if (existingCodeVerification.internalOTP.code == code) {
				outputResponse.VerificationResponse.Valid = true
			} else {
				existingCodeVerification.internalOTP.usedRetryAttempt++
			}

			return outputResponse
		}

		return verifyCodeResponse
	}
}

export default new OTP()
