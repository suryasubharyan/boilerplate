import Joi from "joi";


export const UpdateAccountDetailsDTO = Joi.object({
    firstName: Joi.string().min(2).max(30).optional(),
    lastName: Joi.string().min(2).max(30).optional(),
    linkedInProfileUrl: Joi.string().optional(),
    profileImage: Joi.string().allow(''),
    resume: Joi.string().allow(''),
    removeProfileImage: Joi.boolean().optional()

})