const { response } = require('express')
const collection = require('../configg/collection')
const { PRODUCT_COLLECTION } = require('../configg/collection')
var db=require('../configg/connection')
var  objectId=require('mongodb').ObjectId
module.exports={

    addProduct:(product,callback)=>{
       

      db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            
               callback(data.insertedId)
        })
    },
    getAllProduct:()=>{
        return new Promise (async(resolve,reject)=>{
            let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            console.log(proId)
            
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(proId)}).then((response)=>{
               
                resolve(response)
            })
        })
        
    }
    
    
}