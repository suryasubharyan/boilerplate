import '@core/declarations'
import { MAINTENANCE_MODE_ENUM } from '@models/server-stat'
import { Request, Response, NextFunction } from 'express'

export const maintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const serverStat = await App.Models.ServerStat.findOne({
			name: 'maintenance-mode',
		})

		if (serverStat.value !== MAINTENANCE_MODE_ENUM.OFF) {
			return res.serviceUnavailable({
				message: 'Server is in maintenance mode. Unable to accept request.',
			})
		}

		return next()
	} catch (error) {
		Logger.error(error)
		return res.internalServerError({ error })
	}
}
