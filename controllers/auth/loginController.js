import Joi from "joi"
import { User,RefreshToken } from "../../models"
import CustomErrorHandler from "../../services/CustomErrorHandler"
import bcrypt from "bcryptjs"
import JwtService from "../../services/JwtService"
import { REFRESH_SECRET } from "../../config"


const loginController = {
    //Login Method
    async login(req, res, next) {
        //Request validation
        const loginSchema = Joi.object({//schema defined for each field
            email: Joi.string().email().required(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
        })

        const {error} = loginSchema.validate(req.body)//passing req.body to loginSchema to validate
        if(error){
            return next(error)
        }

        //check if email is present in DB
        try {
            const user = await User.findOne({email: req.body.email})
            //if user not exist throw error
            if(!user){
                return next(CustomErrorHandler.wrongCredentials())
            }

            //If user is present execute below code
            //Compare password
            const match = await bcrypt.compare(req.body.password, user.password)
            if(!match){
                return next(CustomErrorHandler.wrongCredentials())
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
    },



    //Logout Method
    async logout(req, res, next){
        //request validation
        const refreshSchema = Joi.object({//schema defined for each field
            refresh_token: Joi.string().required(),
        })

        const {error} = refreshSchema.validate(req.body)//passing req.body to refreshSchema to validate
        if(error){
            return next(error)
        }

        //delete refresh token from database
        try {
            await RefreshToken.deleteOne({token: req.body.refresh_token})
        } catch (error) {
            return next(error)
        }

        res.json({status: 1})
    }
}


export default loginController