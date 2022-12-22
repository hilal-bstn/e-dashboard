const express=require('express');
const cors=require("cors");
require('./db/config');
const User =require("./db/User");
const Product=require("./db/Product")

const Jwt = require('jsonwebtoken');
const jwtKey = "e-comm";

const app=express();

app.use(express.json());
app.use(cors({
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));

app.post("/register",async (req,resp)=>{
    let user=new User(req.body);
    let result=await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result },jwtKey,{ expiresIn: "2h" },(err,token)=>{
        if(err){
           return resp.send("Something went wrong, please trg after sometime")
        }
  return  resp.send({ result,auth : token})
})
});

app.post("/login",async (req,resp)=>{
if(req.body.password && req.body.email)
{
   let user=await User.findOne(req.body).select("-password");
    if(user)
    {
        Jwt.sign({ user },jwtKey,{ expiresIn: "2h" },(err,token)=>{
                if(err){
                   return resp.send("Something went wrong, please trg after sometime")
                }
          return  resp.send({ user,auth : token})
        })
    }
    else{
      return  resp.send({result:'No user found'})
    }
}
else
{
    return resp.send({result:'No user found'})
}
})

app.post("/add-product",verifyToken,async (req,resp)=>{
    let product=new Product(req.body);
    let result=await product.save();
    return resp.send(result);
})

app.get("/products",verifyToken,async (req,resp)=>{
    let products=await Product.find();
    if(products.length>0)
    {
      return  resp.send(products)
    }
    else{
      return  resp.send({result:"No product found"})
    }
})

app.delete("/product/:id",verifyToken, async (req,resp)=>{
    const result = await Product.deleteOne({_id:req.params.id})
   return resp.send(result);
})

app.get("/product/:id",verifyToken,async (req,resp)=>{
    const result = await Product.findOne({_id:req.params.id});
    if(result)
    {
       return resp.send(result);
    }
    else{
       return resp.send({result:"No record found."});
    }
});


app.put("/product/:id", verifyToken,async (req, resp) => {
    console.log(req)
    let result = await Product.updateOne(
        {
             _id : req.params.id 
        },
        {
            $set : req.body
        }
    )
    if(result)
    {
      return resp.send(result);
    }
    else{
       return resp.send({result:"No record found."});
    }
});

app.get("/search/:key",verifyToken, async (req,resp)=>{
        let result = await Product.find({
            "$or": [
                { name: {$regex:req.params.key} },
                { company: {$regex:req.params.key} },
                { category: {$regex:req.params.key} }
            ]
        });
        return resp.send(result);
})

function verifyToken(req,resp,next){
    let token = req.headers['authorization'];
    if(token)
    { 
        token = token.split(' ')[1];
        Jwt.verify(token, jwtKey,(err,valid)=>{
                if(err)
                {
                    return resp.status(401).send({result:"please privade valid token"})
                }
                else
                {
                    next();
                }
        }); 
    }
    else
    {
        return resp.status(200).send({result:"please add token with header"})
    }
}

app.listen(5000);
