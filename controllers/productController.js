import {Product} from "../models"
import Joi from "joi"
import multer from "multer"
import path from "path"
import CustomErrorHandler from "../services/CustomErrorHandler"
import fs from "fs"
import productSchema from "../validators/productValidator"

//setting up the multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        //Creating unique name for the image file 
        //format(dateInMiliSecond-RandomNumberBetween0&1000000.extension )
        //134234143-34423452342.png
        const uniqueName = `${Date.now()}-${Math.round(Math.random()*1E9)}${path.extname(file.originalname)}`
        cb(null, uniqueName)
    }
})

//5mb file size defined
const handleMultipartData = multer({storage, limits:{fileSize: 1000000 * 5}}).single('image')

const productController = {
    //Create product method
    async store(req, res, next){
        //We are receiving Multipart form data because we are also sending image in the request
        handleMultipartData(req, res, async (err)=>{
            //checking for any error
            if(err){
                return next(CustomErrorHandler.serverError(err.message))
            }

            //Getting a file path
            const filePath = req.file.path

            //Validating the request
            const {error} = productSchema.validate(req.body)//passing req.body to productSchema to validate
            if(error){
                //deleting the uploaded image
                fs.unlink(`${appRoot}/${filePath}`, (err)=>{//rootFolder/uploades/fileName.png
                    if(err){
                        return next(CustomErrorHandler.serverError(err.message))
                    }
                })
                return next(error)
            }


            const {name, price, size} = req.body

            let document
            try {
                document = await Product.create({
                    name,
                    price,
                    size,
                    image: filePath,
                })
            } catch (error) {
                return next(error)
            }

            res.status(201).json(document)
        })
    },


    //Update product method
    update(req, res, next){
        //We are receiving Multipart form data because we are also sending image in the request
        handleMultipartData(req, res, async (err)=>{
            //checking for any error
            if(err){
                return next(CustomErrorHandler.serverError(err.message))
            }

            let filePath
            if(req.file){
                //Getting a file path
                filePath = req.file.path
            }



            //Validating the request
            const {error} = productSchema.validate(req.body)//passing req.body to productSchema to validate
            if(error){
                //deleting the uploaded image
                if(req.file){
                    fs.unlink(`${appRoot}/${filePath}`, (err)=>{//rootFolder/uploades/fileName.png
                        if(err){
                            return next(CustomErrorHandler.serverError(err.message))
                        }
                    })
                }
                return next(error)
            }


            const {name, price, size} = req.body
            //Updating the product in DB
            let document
            try {
                document = await Product.findOneAndUpdate({_id: req.params.id}, {
                    name,
                    price,
                    size,
                    ...(req.file && {image: filePath}),
                }, {new: true}) //new: true will provide updated result in response
            } catch (error) {
                return next(error)
            }

            res.status(201).json(document)
        })
    },


    //Destroying/Deleting the product
    async destroy(req, res, next){
        //deleting the product from DB
        const document = await Product.findOneAndRemove({_id: req.params.id})
        
        //Checking if product is present in DB or not
        if(!document){
            return next(new Error('Nothing to delete'))
        }

        //if product is present then deleting the image of that product
        //_doc will help us to get original url without adding getters in it
        const imagePath = document._doc.image
        fs.unlink(`${appRoot}/${imagePath}`, (err) => {
            if(err){
                return next(CustomErrorHandler.serverError())
            }

            //sending back the product details which are deleted in response
            return res.json(document)
        })

    },


    //GetAll Products
    async index(req, res, next){
        let documents

        //Pagination mongoose pagination

        //getting all products list from db
        try {
            //Sorting the result in desc (-1) manner using sort method
            documents = await Product.find().select('-updatedAt -__v').sort({createdAt: -1})
        } catch (error) {
            return next(CustomErrorHandler.serverError())
        }

        return res.json(documents)
    },


    //Get Single Product
    async show(req, res, next){
        let document

        //getting single product from db using id
        try {
            document = await Product.findOne({_id: req.params.id}).select('-updatedAt -__v')
        } catch (error) {
            return next(CustomErrorHandler.serverError())
        }

        return res.json(document)
    }
}

export default productController