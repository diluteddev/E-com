var express = require('express');

var router = express.Router();
var productHelpers=require('../helpers/product-helper')

/* GET users listing. */
router.get('/', function (req, res, next) {
 productHelpers.getAllProduct().then((products)=>{
  res.render('admin/add-products', {admin:true, products })
 })
  
});
router.get('/add-item', (req, res) => {
  res.render('admin/add-item')

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


module.exports = router;
