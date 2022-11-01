import Joi from "joi"

//Validating the request
const productSchema = Joi.object({//schema defined for each field
    name: Joi.string().required(),
    price: Joi.number().required(),
    size: Joi.string().required(),
    image: Joi.string(),
})


export default productSchema