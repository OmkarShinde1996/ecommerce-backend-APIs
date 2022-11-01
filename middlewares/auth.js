import CustomErrorHandler from "../services/CustomErrorHandler";
import JwtService from "../services/JwtService";


const auth = async (req, res, next) => {
    //get the authorization header from req headers
    let authHeader = req.headers.authorization

    //check if authorization header is present or not in headers
    if(!authHeader){
        return next(CustomErrorHandler.unAuthorized())
    }

    //if authorization header is present
    const token = authHeader.split(' ')[1]

    //check if token is modified by someone or not
    try {
        //verify the token provided in request
        const {_id, role} = await JwtService.verify(token)
        const user = {
            _id,
            role,
        }
        req.user = user
        next()
    } catch (error) {
        return next(CustomErrorHandler.unAuthorized())
    }
}

export default auth