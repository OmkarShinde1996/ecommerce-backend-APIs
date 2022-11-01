import Joi from "joi"
import CustomErrorHandler from "../../services/CustomErrorHandler"
import {RefreshToken, User} from "../../models"
import bcrypt from "bcryptjs"
import JwtService from "../../services/JwtService"
import { REFRESH_SECRET } from "../../config"

const registerController = {
    async register(req, res, next){
        //request validation
        const registerSchema = Joi.object({ //schema defined for each field
            name: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            repeat_password: Joi.ref('password')
        })

        const {error} = registerSchema.validate(req.body) //passing req.body to registerSchema to validate
        if(error){
            return next(error)
        }

        //check if user is in the database already
        try {
            const exist = await User.exists({email: req.body.email})
            if(exist){
                return next(CustomErrorHandler.alreadyExist('This email is already taken.'))
            }
        } catch (error) {
            return next(error)
        }

        const {name, email, password} = req.body
        //Hash Password
        const hashedPassword = await bcrypt.hash(password, 10)

        //prepare the model
        const user = new User({
            name,
            email,
            password: hashedPassword
        })

        //save above data to database
        let access_token
        let refresh_token
        try {
            const result = await user.save()

            //create token
            access_token = JwtService.sign({_id: result._id, role: result.role})
            refresh_token = JwtService.sign({_id: result._id, role: result.role}, '1y', REFRESH_SECRET)

            //Add refresh token in DB whitelist
            await RefreshToken.create({token: refresh_token})

        } catch (error) {
            return next(error)
        }


        res.json({access_token, refresh_token})
    }
}

export default registerController