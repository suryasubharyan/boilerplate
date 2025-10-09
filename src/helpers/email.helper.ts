import {
    SESClient,
    SendEmailCommand,
    ListIdentitiesCommand,
    SendEmailCommandInput,
} from '@aws-sdk/client-ses'
import nodemailer from 'nodemailer'

// Load credentials from the environment file
const ID = App.Config.AWS.ACCESS_KEY_ID
const SECRET = App.Config.AWS.SECRET_ACCESS_KEY
const REGION = App.Config.AWS.REGION
const SES_DEFAULT_EMAIL = App.Config.AWS.SES_DEFAULT_FROM_EMAIL
const EMAIL_CONF = App.Config.EMAIL

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
    private transporter: nodemailer.Transporter | null = null

	constructor() {
        this.SES = new SESClient({
            region: REGION,
            credentials: {
                accessKeyId: ID,
                secretAccessKey: SECRET,
            },
        })

        if (EMAIL_CONF?.PROVIDER === 'brevo') {
            this.transporter = nodemailer.createTransport({
                host: EMAIL_CONF.BREVO_SMTP_HOST,
                port: EMAIL_CONF.BREVO_SMTP_PORT,
                secure: EMAIL_CONF.BREVO_SMTP_PORT === 465,
                auth: {
                    user: EMAIL_CONF.BREVO_SMTP_USER,
                    pass: EMAIL_CONF.BREVO_SMTP_PASS,
                },
            })
        }
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
        from = EMAIL_CONF?.FROM_EMAIL || SES_DEFAULT_EMAIL,
        replyTo = EMAIL_CONF?.FROM_EMAIL || SES_DEFAULT_EMAIL,
		subject,
		templateName,
		data = {},
    }: EmailParams): Promise<any> {
        // Development mode: Log email instead of sending
        if (EMAIL_CONF?.PROVIDER === 'dev' || (!ID && EMAIL_CONF?.PROVIDER !== 'brevo')) {
            const { returnTemplate } = await import(`../../build/templates/${templateName}.js`)
            const parsedHTML = returnTemplate(data)
            
            Logger.info(`[DEV MODE] Email would be sent to: ${to}`)
            Logger.info(`[DEV MODE] Subject: ${subject}`)
            Logger.info(`[DEV MODE] Content: ${parsedHTML}`)
            Logger.info(`[DEV MODE] OTP Code: ${data.OTP}`)
            
            return { MessageId: 'dev-mode-message-id' }
        }

        const { returnTemplate } = await import(`../../build/templates/${templateName}.js`)
        const parsedHTML = returnTemplate(data)

        const toAddresses = Array.isArray(to) ? to : [to]
        const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : []

        if (EMAIL_CONF?.PROVIDER === 'brevo' && this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from,
                    to: toAddresses,
                    cc: ccAddresses,
                    subject,
                    html: parsedHTML,
                    replyTo,
                })
                Logger.info(`Email sent via Brevo SMTP to ${to}`)
                return info
            } catch (error: any) {
                Logger.error(error.message)
            }
        }

        // Fallback to SES if configured and provider not brevo
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
        }
	}
}

export const MailHelper = new SESHelper()
