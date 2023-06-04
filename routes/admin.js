var express = require('express');

var router = express.Router();
var productHelpers=require('../helpers/product-helper');
const { response } = require('../app');
const userHelpers = require('../helpers/user-helpers');

/* GET users listing. */
router.get('/', function (req, res, next) {
 productHelpers.getAllProduct().then((products)=>{
  res.render('admin/add-products', {admin:true, products })
 })
  
});
router.get('/add-item', (req, res) => {
  res.render('admin/add-item',{admin:true})


})
router.post('/add-item', (req, res) => {
  console.log(req.body)
  console.log(req.files.image)

productHelpers.addProduct(req.body,(id)=>{
  let imag=req.files.image
   imag.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
    if(!err){
      res.render('admin/add-item')
    }
  })

})

})
router.get('/delete-product/',(req,res)=>{
let proId=req.query.id
console.log(proId)
productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin/')
})



})

router.get('/edit-product',async(req,res)=>{
  let product=await productHelpers.getProductDeatils(req.query.id)
  console.log(product)
  res.render('admin/edit-product',{admin:true,product})
})
router.post('/edit-product',(req,res)=>{
  productHelpers.updateProduct(req.query.id ,req.body).then(()=>{
    res.redirect('/admin')
    
    if(req?.files?.image){
      let imag=req.files.image
       imag.mv('./public/product-images/'+req.query.id+'.jpg')
    }
  })
  
})
router.get('/login',(req,res)=>{

    res.render('admin/login')

})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin=response.user
      console.log('admin loged in')
    }
  })
})



module.exports = router;
