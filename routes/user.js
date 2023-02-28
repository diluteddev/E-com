var express = require('express');
const { response } = require('../app');
var router = express.Router();
let productHelpers=require('../helpers/product-helper')
let userHelpers=require('../helpers/user-helpers')

const veryfyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
   next()
  }
  else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', function(req, res, next) {
  let user =req.session.user
  
 productHelpers.getAllProduct().then((products)=>{
    res.render('user/view-products', { products ,user})
   })
 
});
router.get('/login',(req,res)=>{
  
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    res.render('user/login',{"LF":req.session.LF,"mailErr":req.session.mailErr})
    req.session.mailErr=null
    req.session.LF=null
    
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response)
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
     req.session.user=response.user
      req.session.loggedIn=true
      res.redirect('/')
    }
    else{

      req.session.LF= response.LF
      req.session.mailErr= response.mailErr
     
      res.redirect('/login')
    }
  })
  router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/')
  })
  router.get('/cart',veryfyLogin,(req,res)=>{
    res.render('user/cart')
    
  })

})

module.exports = router;
