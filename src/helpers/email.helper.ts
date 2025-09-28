import {
	SESClient,
	SendEmailCommand,
	ListIdentitiesCommand,
	SendEmailCommandInput,
} from '@aws-sdk/client-ses'

// Load credentials from the environment file
const ID = App.Config.AWS.ACCESS_KEY_ID
const SECRET = App.Config.AWS.SECRET_ACCESS_KEY
const REGION = App.Config.AWS.REGION
const SES_DEFAULT_EMAIL = App.Config.AWS.SES_DEFAULT_FROM_EMAIL

interface EmailParams {
	to: string | string[]
	cc?: string | string[]
	from?: string
	replyTo?: string
	subject: string
	templateName: string
	data?: Record<string, any>
}

class SESHelper {
	private SES: SESClient

	constructor() {
		this.SES = new SESClient({
			region: REGION,
			credentials: {
				accessKeyId: ID,
				secretAccessKey: SECRET,
			},
		})
	}

	async checkIdentities(): Promise<void> {
		const command = new ListIdentitiesCommand({})
		const response = await this.SES.send(command)
		const identities = response.Identities || []

		if (!identities.includes(SES_DEFAULT_EMAIL)) {
			throw new Error(
				`Configured AWS_SES_DEFAULT_EMAIL_ID isn't verified on the console. Add the identity and try again.`
			)
		}
	}

	async send({
		to,
		cc,
		from = SES_DEFAULT_EMAIL,
		replyTo = SES_DEFAULT_EMAIL,
		subject,
		templateName,
		data = {},
	}: EmailParams): Promise<any> {
		const { returnTemplate } = await import(`../../build/templates/${templateName}.js`)
		const parsedHTML = returnTemplate(data)

		const toAddresses = Array.isArray(to) ? to : [to]
		const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : []

		const params: SendEmailCommandInput = {
			Destination: {
				ToAddresses: toAddresses,
				CcAddresses: ccAddresses,
			},
			Message: {
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: parsedHTML,
					},
				},
				Subject: {
					Charset: 'UTF-8',
					Data: subject,
				},
			},
			Source: from,
		}

		if (replyTo) {
			params.ReplyToAddresses = [replyTo]
		}

		const command = new SendEmailCommand(params)
		try {
			const response = await this.SES.send(command)
			Logger.info(`Email sent successfully to ${to}`)
			return response
		} catch (error: any) {
			Logger.error(error.message)
			// throw new Error(`Error sending email: ${error.message}`)
		}
	}
}

export const MailHelper = new SESHelper()
