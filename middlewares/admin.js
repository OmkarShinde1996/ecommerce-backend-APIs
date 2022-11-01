import { User } from "../models"
import CustomErrorHandler from "../services/CustomErrorHandler"

const admin = async (req, res, next) => {
    try {
        //check if the user is present in DB
        const user = await User.findOne({_id: req.user._id})

        //check if the user is admin
        if(user.role === 'admin'){
            next()
        }else{
            return next(CustomErrorHandler.unAuthorized())
        }
    } catch (error) {
        return next(CustomErrorHandler.serverError())
    }
}

export default admin