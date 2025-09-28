import multer from 'multer'

const storage = multer.diskStorage({})

const upload = multer({ storage: storage, limits: { fileSize: 3 * 1024 * 1024 } })

export const MulterHelper = upload
