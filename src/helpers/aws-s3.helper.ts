import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { promises as fsPromises } from 'fs'

const BUCKET_NAME = App.Config.AWS.S3_BUCKET_NAME
const ID = App.Config.AWS.ACCESS_KEY_ID
const SECRET = App.Config.AWS.SECRET_ACCESS_KEY
const REGION = App.Config.AWS.REGION

class AwsS3Helper {
	private s3: S3Client

	constructor() {
		this.s3 = new S3Client({
			region: REGION,
			credentials: {
				accessKeyId: ID,
				secretAccessKey: SECRET,
			},
		})
	}

	async UploadFile({
		fileData,
		folderName,
		fileName,
		fileExtension,
		bucket = BUCKET_NAME,
		isPublic = true,
	}: {
		fileData: Buffer | any
		folderName: string
		fileName: string
		fileExtension: string
		bucket?: string
		isPublic?: boolean
	}) {
		try {
			const file = await fsPromises.readFile(fileData.path)
			const params: any = {
				ACL: isPublic ? 'public-read' : 'private',
				Bucket: bucket,
				Key: `${folderName}/${fileName}`,
				Body: file,
				ContentType: fileExtension,
			}

			const command = new PutObjectCommand(params)
			const data = await this.s3.send(command)

			const fileKey = `${folderName}/${fileName}`

			const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`
			return { fileKey, fileUrl }
		} catch (error) {
			Logger.error(error)
			throw new Error(error?.message ?? App.Messages.GeneralError.SomethingWentWrong())
		}
	}

	async DeleteFile(fileKey: string) {
		try {
			fileKey = fileKey.replace('%40', '@')
			const params = {
				Bucket: BUCKET_NAME,
				Key: fileKey,
			}

			const command = new DeleteObjectCommand(params)
			const data = await this.s3.send(command)

			return data
		} catch (error) {
			Logger.error(error)
			throw new Error(error?.message ?? App.Messages.GeneralError.SomethingWentWrong())
		}
	}
}

export const S3Helper = new AwsS3Helper()
