var collection = require('../configg/collection')
var db = require('../configg/connection')
const bcrypt = require('bcrypt')
const { USER_COLLECTION, PRODUCT_COLLECTION } = require('../configg/collection')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
const Razorpay=require('razorpay')


var instance = new Razorpay({
    key_id: 'rzp_test_ge1TBzNQx2gsF6',
    key_secret: 'Ing2kpKaDaiG8sQMeBLkVmOB',

});


module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {

                resolve(userData)
            })


        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("Login failed")
                        response.LF = true
                        response.status = false
                        resolve(response)

                    }
                })
            } else {
                console.log("No user found with this mail")
                response.mailErr = true
                response.status = false
                resolve(response)
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {

            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (cart) {
                let proExist = cart.product.findIndex(product => product.item == proId)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({
                        user: new ObjectId(userId),
                        "product.item": new ObjectId(proId)
                    },
                        {
                            $inc: { 'product.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()
                    })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new ObjectId(userId) },
                        {
                            $push: { product: proObj }


                        }
                    ).then((response) => {
                        resolve(response)
                    })

                }


            }
            else {
                let cartObj = {
                    user: new ObjectId(userId),
                    product: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getCartItem: (userId) => {

        return new Promise(async (resolve, reject) => {

            cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$productDetails', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems)


        })
    },
    getCartCount: (userId) => {
        let count = null;
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION)
                .findOne({ user: new ObjectId(userId) })
            if (cart) {
                count = cart.product.length


            }
            resolve(count)
        })

    },
    changeProductQuantity: (details) => {

        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: new ObjectId(details.cartId)

                },
                    {
                        $pull: { product: { item: new ObjectId(details.proId) } }
                    }

                ).then((response) => {
                    resolve({ removeProduct: true })
                })

            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: new ObjectId(details.cartId)
                    , 'product.item': new ObjectId(details.proId)
                },
                    {
                        $inc: { 'product.$.quantity': details.count }
                    }
                ).then((response) => {
                    resolve({ status: true })
                })
            }
        })

    },
    removeProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cartId) },
                {
                    $pull: { product: { item: new ObjectId(details.proId) } }
                }

            ).then((response) => {
                resolve(response)
            })

        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let price = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: new ObjectId(userId) },
                    },
                    {
                        $unwind: "$product",
                    },
                    {
                        $project: {
                            item: "$product.item",
                            quantity: "$product.quantity",
                        },
                    },
                    {
                        $lookup: {
                            from: PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "productDetails",
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ["$productDetails", 0] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: {
                                    $multiply: [
                                        { $toInt: "$quantity" },
                                        { $toInt: "$product.price" },
                                    ],
                                },
                            },
                        },
                    },
                ])
                .toArray();


            resolve(price[0].total);

        });
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
           
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {

                deliveryDetails: {
                    address: order.address,
                    phone: order.mobile,
                    pin: order.pincode,
                    date: new Date()
                },
                user: new ObjectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                status: status,
                totalAmount: total,//total not defined
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async (response) => {
                await db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) });
                resolve(response.insertedId);

            });

        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            resolve(cart.product)
        })
    },
    getOrderList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).find({ user: new ObjectId(userId) }).toArray()
            resolve(order)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {

            orderItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { _id: new ObjectId(orderId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$productDetails', 0] }
                    }
                }

            ]).toArray()

            resolve(orderItems)


        })
    }, 
    generateRazorpay: (orderId,totalPrice) => {
     return new Promise((resolve,reject)=>{

       
        var options={
            amount: totalPrice*100,
            currency: "INR",
            receipt: ""+orderId,

        }
        

        instance.orders.create(options,function(err,order){
            
            if(err){
                console.log(err)
            }
            else{
                console.log("New order:",order)
                resolve(order)
            }

        })
     })

    },
    checkPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            var crypto = require('crypto');
            let hmac=crypto.createHmac('sha256','Ing2kpKaDaiG8sQMeBLkVmOB')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')   
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    chagePayementStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }



}
