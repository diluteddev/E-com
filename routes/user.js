const { json } = require('express');
var express = require('express');
const { response } = require('../app');
var router = express.Router();
let productHelpers=require('../helpers/product-helper');
const { getTotalAmount } = require('../helpers/user-helpers');
let userHelpers=require('../helpers/user-helpers')

const veryfyLogin=(req,res,next)=>{
  if(req.session.user.loggedIn){
   next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user =req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
  
  }
  
  
 productHelpers.getAllProduct().then((products)=>{
    res.render('user/view-products', { products ,user,cartCount})
   })

});
router.get('/login',(req,res)=>{
  let loginDetails=req.session.loginDetails
  if(req.session.user){
    res.redirect('/')
  }
  else{
    res.render('user/login',{loginDetails})
    loginDetails=null
    
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
  
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
   
    req.session.user=response
    req.session.user.loggedIn=true

    res.redirect('/')
  })
})
router.post('/login',(req,res)=>{
  console.log(req.body)
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
     req.session.user=response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }
    else{
      
        req.session.loginDetails=response
      // req.session.LF= response.LF
      // req.session.mailErr= response.mailErr
      res.redirect('/login')
    
    
    }
  })
  router.get('/logout',(req,res)=>{
    req.session.user=null
    res.redirect('/')
  })
  router.get('/cart',veryfyLogin,async(req,res)=>{
    
    let products=await userHelpers.getCartItem(req.session.user._id)
    let total=0;
    if(products.length>0){
      total=await userHelpers.getTotalAmount(req.session.user._id)
    }
     
   
   
      res.render('user/cart',{products,'user':req.session.user._id,total})
    
  
  
  })
  

})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call')
 
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    
    
 res.json({status:true})
 
  })
})
router.post('/change-product-quantity',(req,res,next)=>{

  userHelpers.changeProductQuantity(req.body).then(async(response)=>{

   response.total=await userHelpers.getTotalAmount(req.body.userId)
    res.json(response)

  })
})
router.get('/place-order',veryfyLogin, async(req,res)=>{
  
  let total=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/place-order',{total,'user':req.session.user})
  
  
})
router.post('/place-order',async(req,res)=>{
  console.log(req.body,'hello moto')
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    
    
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
      

    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
       res.json(response)
      })
    }
  
  

  })
  console.log(req.body)

})
router.get('/success',(req,res)=>{
  res.render('user/success',{user:req.session.user})
})
router.get('/order',async(req,res)=>{
  let orders=await userHelpers.getOrderList(req.session.user._id)
  res.render('user/order-page',{user:req.session.user,orders})

})
router.get('/ordered-item/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  
  res.render('user/ordered-item',{products})

})
router.post('/verify-payment',(req,res)=>{
  userHelpers.checkPayment(req.body).then((response)=>{
    
      userHelpers.chagePayementStatus(req.body['order[receipt]']).then(()=>{
        console.log('payment sucessfull')
        res.json({status:true})
      })
   
  }).catch((err)=>{
    console.log(err)
    res.json({status:false,errMsg:'catch called'})

  })
 
})



module.exports = router;
