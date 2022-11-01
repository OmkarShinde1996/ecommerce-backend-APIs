import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken"

class JwtService{
    //Singing the token meanse encrypting the data in token
    static sign(payload, expiry = '60s', secret = JWT_SECRET){
        return jwt.sign(payload, secret, {expiresIn: expiry})
    }

    //Verifying the token if it is modified or not
    static verify(token, secret = JWT_SECRET){
        return jwt.verify(token, secret)
    }

}

export default JwtService