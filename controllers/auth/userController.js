import { User } from "../../models"
import CustomErrorHandler from "../../services/CustomErrorHandler"


const userController = {
    async me(req, res, next){
        try {
            //check if user is present in DB or not using _id
            //used select method to remove certain fields from response body  using "-" sign
            const user = await User.findOne({_id: req.user._id}).select('-password -updatedAt -__v')
            
            //if user not found
            if(!user){
                return next(CustomErrorHandler.notFound())
            }

            //if user found
            res.json(user)
        } catch (error) {
            return next(error)
        }
    }
}

export default userController