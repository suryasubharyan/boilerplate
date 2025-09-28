import '@core/declarations'
import { FileExistsSync } from './utils'

export interface ConfigInterface {
	HOST: string
	PORT: number
	ENVIRONMENT: string
	DB_CONNECTION_STRING: string
	DB_CONNECTION_OPTIONS: any

	ITEMS_PER_PAGE: number

	SALT_ROUNDS: number
	JWT_SECRET: string
	JWT_EXPIRY: string

	AWS: {
		ACCESS_KEY_ID: string
		SECRET_ACCESS_KEY: string
		REGION: string
		SES_DEFAULT_FROM_EMAIL: string
		BRAND_NAME: string
		S3_BUCKET_NAME: string
		SUPPORT_EMAIL: string
	}
	CODE_VERIFICATION: {
		LINK_TOKEN_LENGTH: number

		EXPIRATION_TIME: number // in minutes
		EXPIRATION_TIME_UNIT: string

		EXPIRATION_TIME_FOR_PASSED_CODE: number // in minutes
		EXPIRATION_TIME_FOR_PASSED_CODE_UNIT: string

		RESEND_DURATION: number[] // in seconds
		RESEND_DURATION_UNIT: string

		RESEND_LIMIT_IN_SESSION: number

		RESEND_SESSION_DURATION: number // in minutes
		RESEND_SESSION_DURATION_UNIT: string
	}

	SIGNIN: {
		INVALID_SIGNIN_ATTEMPTS_LIMIT: number

		MULTIPLE_SIGNIN_ATTEMPTS_BLOCK_DURATION: number // in hours
		MULTIPLE_SIGNIN_ATTEMPTS_BLOCK_DURATION_UNIT: string
	}
	CRYPTO_SECRET_KEY: string
	MAX_FILE_SIZE: number
}

export default (): ConfigInterface => {
	const { NODE_ENV = 'development' } = process.env
	const environment = NODE_ENV?.toLowerCase()
	const environmentFileLocation = `${__dirname}/../environments`
	const environmentFilePath = `${environmentFileLocation}/${environment}`
	if (FileExistsSync(environmentFilePath)) {
		// eslint-disable-next-line
		const configuration: ConfigInterface = require(environmentFilePath).default()
		return configuration
	} else {
		Logger.error(`Missing environment file for NODE_ENV=${environment}.`)
		throw Error(`Missing environment file for NODE_ENV=${environment}.`)
	}
}
