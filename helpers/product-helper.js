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
        
    },
    
    getProductDeatils:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
        
    },
    updateProduct:(proId,proDeatils)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:new objectId(proId)},{
                    $set:{
                        name:proDeatils.name,
                        Category:proDeatils.Category,
                        price:proDeatils.price,
                        Description:proDeatils.Description,


                    }
                }).then((response)=>{
                resolve()
            })
        })
    },
   
    
    
}