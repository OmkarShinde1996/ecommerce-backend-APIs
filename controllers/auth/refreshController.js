import Joi from "joi"
import { REFRESH_SECRET } from "../../config"
import { RefreshToken, User } from "../../models"
import CustomErrorHandler from "../../services/CustomErrorHandler"
import JwtService from "../../services/JwtService"

const refreshController = {
    async refresh(req, res, next){
         //Request validation
        const refreshSchema = Joi.object({//schema defined for each field
            refresh_token: Joi.string().required(),
        })

        const {error} = refreshSchema.validate(req.body)//passing req.body to registerSchema to validate
        if(error){
            return next(error)
        }

        //proceed further if no error
        let refreshToken
        try {
            refreshToken = await RefreshToken.findOne({token: req.body.refresh_token})
            if(!refreshToken){
                return next(CustomErrorHandler.unAuthorized('Invalid refresh token'))
            }


            //Check if token is tempered or not
            let userId
            try {
                const {_id} = await JwtService.verify(refreshToken.token, REFRESH_SECRET)
                userId = _id
            } catch (error) {
                return next(CustomErrorHandler.unAuthorized('Invalid refresh token'))
            }

            
            //check if token is already present in DB or not
            const user = await User.findOne({_id: userId})
            if(!user){
                return next(CustomErrorHandler.unAuthorized('No user found!'))
            }

            //generate token if password matches
            const access_token = JwtService.sign({_id: user._id, role: user.role})
            const refresh_token = JwtService.sign({_id: user._id, role: user.role}, '1y', REFRESH_SECRET)

            //Add refresh token in DB whitelist
            await RefreshToken.create({token: refresh_token})

            //Send the generated token to client
            res.json({access_token, refresh_token})


        } catch (error) {
            return next(error)
        }
    }
}

export default refreshController