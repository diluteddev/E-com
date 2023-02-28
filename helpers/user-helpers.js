var collection = require('../configg/collection')
var db=require('../configg/connection')
const bcrypt=require('bcrypt')
const { USER_COLLECTION } = require('../configg/collection')

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(userData)
        })
   

     })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
let response={}

            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
     if(user){
        bcrypt.compare(userData.Password,user.Password).then((status)=>{
            if(status){
               response.user=user
                response.status=true
                resolve(response)
            }
            else{
                console.log("Login failed")
                response.LF=true
                response.status=false
                resolve(response)

            } 
        })
     }else{
        console.log("No user found with this mail")
        response.mailErr=true
        response.status=false
        resolve(response)
     }
    })
}
}
     