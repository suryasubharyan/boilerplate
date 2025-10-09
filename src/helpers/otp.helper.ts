import '@core/declarations'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import axios from 'axios'
import { Vonage } from '@vonage/server-sdk'

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

// Initialize Vonage client (lazy initialization)
let vonageClient: Vonage | null = null
const getVonageClient = () => {
    if (!vonageClient && App.Config.SMS?.VONAGE_API_KEY && App.Config.SMS?.VONAGE_API_SECRET) {
        vonageClient = new Vonage({
            apiKey: App.Config.SMS.VONAGE_API_KEY,
            apiSecret: App.Config.SMS.VONAGE_API_SECRET,
        })
    }
    return vonageClient
}

export class OTP {
	async SendCodeToMobile(phone: string, content: string) {
        // Prefer Vonage SMS if configured
        if (App.Config.SMS?.PROVIDER === 'vonage' && App.Config.SMS.VONAGE_API_KEY) {
            try {
                const vonage = getVonageClient()
                if (!vonage) {
                    throw new Error('Vonage client not initialized. Check API credentials.')
                }

                const from = App.Config.SMS.VONAGE_FROM || 'Vonage APIs'
                const to = phone // Should be in E.164 format like 916000682833
                const text = content

                const resp = await vonage.sms.send({ to, from, text })
                Logger.info(`SMS sent via Vonage to ${phone}`)
                Logger.info(`Vonage response:`, resp)
                return resp
            } catch (error: any) {
                Logger.error('Vonage SMS error:', error?.response?.data || error.message)
                throw error
            }
        }

        // Brevo SMS if configured
        if (App.Config.SMS?.PROVIDER === 'brevo' && App.Config.SMS.BREVO_API_KEY) {
            try {
                const resp = await axios.post(
                    'https://api.brevo.com/v3/transactionalSMS/sms',
                    {
                        sender: App.Config.SMS.BREVO_SENDER,
                        recipient: phone, // must be E.164 like +916000682833
                        content,
                        type: 'transactional',
                    },
                    {
                        headers: {
                            'api-key': App.Config.SMS.BREVO_API_KEY,
                            'content-type': 'application/json',
                            accept: 'application/json',
                        },
                    }
                )
                Logger.info(`SMS sent via Brevo to ${phone}`)
                return resp.data
            } catch (error: any) {
                Logger.error(error?.response?.data || error.message)
                throw error
            }
        }

        // Dev mode: log instead of sending
        if (App.Config.SMS?.PROVIDER === 'dev' || (!ID && App.Config.SMS?.PROVIDER !== 'vonage' && App.Config.SMS?.PROVIDER !== 'brevo')) {
            Logger.info(`[DEV MODE] SMS would be sent to ${phone}: ${content}`)
            return { MessageId: 'dev-mode-sms' }
        }

        // Fallback to AWS SNS
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
