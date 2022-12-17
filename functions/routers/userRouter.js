/* eslint-disable no-undef */
const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const userRouter = express.Router();
var nodemailer = require('nodemailer');

const User = require('../models/userModel.js');
const { generateToken } = require('../utils/generateToken.js');
const { isAuth } = require('../utils/isAuth.js');
const { allUsers } = require('../controllers/userController.js');
const { isAdmin } = require('../utils/isAdmin.js');



// register router
userRouter.post('/register', expressAsyncHandler( async(req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
        image: req.body.image,
      terms:req.body.terms
    });

    //check if user exist with the same email
    const existingUser = await User.findOne({email: req.body.email});
    if(existingUser){
        return res.status(500).json({ message: "Email already used by another user" });
    }

    const createdUser = await user.save();
    //send verification link to the user's email has been removed from here
    
    res.status(201).json({
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        isAdmin: createdUser.isAdmin,
        isSeller: createdUser.isSeller,
        isBanned: createdUser.isBanned,
        isActive: createdUser.isActive,
        image: createdUser.image,
        terms: createdUser.terms,
        status: createdUser.status,
        token: generateToken(createdUser)
    })
}))

//send verification link
// userRouter.post('/sendverificationlink', expressAsyncHandler(async(req, res) =>{
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return res.json({ message: `Cannot sent verification link` })
//   } else {
//     const link = `http://localhost:3000/confirmverification/${user._id}`
//     //send reset link to the user's email
//     let transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         type: 'OAuth2',
//         user: process.env.MAIL_USERNAME,
//         pass: process.env.MAIL_PASSWORD,
//         clientId: process.env.OAUTH_CLIENTID,
//         clientSecret: process.env.OAUTH_CLIENT_SECRET,
//         refreshToken: process.env.OAUTH_REFRESH_TOKEN
//       }
//     });

//     let mailOptions = {
//       from: "mosganda2022@gmail.com",
//       to: req.body.email,
//         subject: 'Email verification',
//        html: `  <h3 style="color:#fff; color:green; text-align:center;padding:10px;">Mosganda -- Email verification</h3>
//                 <p style="margin:10px">Please click on the link below to verify your email.</p>
//                 <a href=${link} style="text-align:center; background-color: #1c86ee; padding:10px; font-size:18px; color:white; margin:20px 10px;text-decoration:none">Verify Email</a>
//                 <p style="margin:10px">This message is intended for <strong>${user.name}</strong>. If you do not know about this message, kindly ignore.</p>
//             `,
//     //   text: 'Hi from your Mosganda project'
//     };
    
//     transporter.sendMail(mailOptions, function(err, data) {
//       if (err) {
//         console.log("Error " + err);
//       } else {
//         console.log("Email sent successfully");
//         res.json({
//           message: "A verification link has been sent to your email.",
//         })
//       }
//     });
    
//   }
// }))

userRouter.post('/sendverificationlink', expressAsyncHandler(async(req, res) =>{
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({ message: `Cannot sent verification link` })
  } else {
    const link = `https://www.mosganda.com/confirmverification/${user._id}`
    //send reset link to the user's email
    let transporter = nodemailer.createTransport({
      host:"smtp.zoho.com",
      secure: true,
      port: 465,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD

      }
    });

    let mailOptions = {
      from: "moses@mosganda.com",
      to: req.body.email,
        subject: 'Email verification',
       html: `  <h3 style="color:green; text-align:center;padding:10px;">Mosganda -- Email verification</h3>
                <p style="margin:10px">Please click on the link below to verify your email.</p>
                <a href=${link} style="text-align:center; background-color: #1c86ee; padding:10px; font-size:18px; color:white; margin:10px;text-decoration:none;border-radius:10px">Verify Email</a>
                <p style="margin:10px">This message is intended for <strong>${user.name}</strong>. If you do not know about this message, kindly ignore.</p>
            `,
    //   text: 'Hi from your Mosganda project'
    };
    
   transporter.sendMail(mailOptions, function(err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        console.log("Email sent successfully");
        res.json({
          message: "A verification link has been sent to your email.",
        })
      }
    });
    
  }
}))


//search for users
userRouter.get('/search', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
  const searchUser = await User.find(
          { name: { $regex: req.query.search, $options: "i" }, _id: { $ne: req.user._id } },
  );
  if (searchUser) {
    res.json(searchUser)
  }
}))



//get all users for admin
userRouter.get('/find', isAuth, isAdmin, expressAsyncHandler( async(req, res)=> {
    const findUsers = await User.find({});
    if (findUsers) {
        res.json(findUsers);
    }

}));

// //find chat users
// userRouter.get('/chat', isAuth, expressAsyncHandler(async (req, res) => {
//     const users = await User.find({name: { $regex: req.query.search, $options: "i" }});
//     res.json(users)
   
// }))

userRouter.get('/', isAuth, allUsers)
//Login router

userRouter.post('/login', expressAsyncHandler( async(req, res) => {
    const user = await User.findOne({email: req.body.email});

    if (user) {
        if (user.isBanned) {
        res.status(401).json({ message: "You are blocked." })
        return
    }

    if (!user.isActive) {
      res.status(401).json({ message: "Please, verify your email." })
      return
  }
        const token = generateToken(user);
        if(bcrypt.compareSync(req.body.password, user.password)){
            
            res.status(201).json({
                message: "Login successful",
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                isSeller: user.isSeller,
                address: user.address,
                isBanned: user.isBanned,
                isActive: user.isActive,
                phone: user.phone,
                image: user.image,
                token
            });
            return
        }
    }
    res.status(401).json({message: "Invalid email or password."})
}))


//route for user details
userRouter.get('/:id', isAuth, expressAsyncHandler( async(req, res)=>{
    const user = await User.findById(req.params.id);
    if(user){
        res.json(user)
    }else{
        res.status(404).send({message: "User Not Found"})
    }
}))



//route to update a user
userRouter.put('/profile', isAuth, expressAsyncHandler(async(req, res)=>{
    const user = await User.findById(req.user._id);
    if(user){
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;
        user.image = req.body.image || user.image;
        if(req.body.password) {
            user.password = bcrypt.hashSync(req.body.password, 8)
        }
        const updatedUser = await user.save();
        res.json({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          isSeller: updatedUser.isSeller,
          isBanned: updatedUser.isBanned,
          isActive: updatedUser.isActive,
          phone: updatedUser.phone,
          address: updatedUser.address,
          image: updatedUser.image,
          token: generateToken(updatedUser),
        });
    }
}))


//update a user that created a store
userRouter.put('/createstore', isAuth, expressAsyncHandler( async(req,res) =>{
    const user = await User.findById(req.body.user);
    if(user){
        user.isSeller = true;
    }
    const updatedUser = await user.save();
  res.json({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          isSeller: updatedUser.isSeller,
          isBanned: updatedUser.isBanned,
          isActive: updatedUser.isActive,
          phone: updatedUser.phone,
          address: updatedUser.address,
          image: updatedUser.image,
          token: generateToken(updatedUser)
  })
}))

//block a user
userRouter.put('/banned', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.body.id);
    if (user) {
        user.isBanned = true
    }
    const bannedUser = await user.save()
    res.json(bannedUser)
}))

//unblock a user
userRouter.put('/unbanned', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.body.id);
    if (user) {
        user.isBanned = false
    }
    const bannedUser = await user.save()
    res.json(bannedUser)
}))


//login with google


// userRouter.post("/auth/google", async (req, res) => {
//     const { token }  = req.body
//     const ticket = await client.verifyIdToken({
//         idToken: token,
//         audience: process.env.GOOGLE_CLIENT_ID
//     });
//     const { name, email, picture } = ticket.getPayload();
//     const user = await User.upsert({
//          where: { email: email },
//          update: { name, picture },
//         create: { name, email, picture }
//     })
    
//     res.status(201)
//     res.json(user)
// })

//send link to reset password
userRouter.post('/forgotpassword', expressAsyncHandler(async (req, res) => {
  // text: `http://localhost:5000/api/v1/user/reset-password/${user._id}/${token}

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({ message: `No user with email: ${req.body.email} in our database.` })
  } else {
    const link = `https://www.mosganda.com/resetpassword/${user._id}`
    //send reset link to the user's email
    let transporter = nodemailer.createTransport({
      host:"smtp.zoho.com",
      secure: true,
      port: 465,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD

      }
    });

    let mailOptions = {
      from: "moses@mosganda.com",
      to: req.body.email,
        subject: 'Reset password',
       html: `  <h3 style="color:green; text-align:center;padding:10px;">Mosganda -- Reset Password</h3>
                <p style="margin:10px">Please click on the link below to reset your password.</p>
                <a href=${link} style="text-align:center; background-color: #1c86ee; padding:10px; font-size:18px; color:white; margin:20px 10px;text-decoration:none;border-radius:10px">Reset Password</a>
                <p style="margin:10px">This message is intended for <strong>${user.name}</strong>. If you do not know about this message, kindly ignore.</p>
            `,
    //   text: 'Hi from your Mosganda project'
    };
    
    transporter.sendMail(mailOptions, function(err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        console.log("Email sent successfully");
        res.json({
          message: "Password reset link has been sent to your email.",
        })
      }
    });
    
  }
  
}))

//get a new password
userRouter.put('/resetpassword/:id', expressAsyncHandler((async (req, res) => {

   const user = await User.findById(req.params.id);
  if (user) {
     user.password = bcrypt.hashSync(req.body.password, 8) || user.password
  }

  const updatedUser = await user.save();
  res.json({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          isSeller: updatedUser.isSeller,
          isBanned: updatedUser.isBanned,
          isActive: updatedUser.isActive,
          phone: updatedUser.phone,
          address: updatedUser.address,
          image: updatedUser.image,
         token: generateToken(updatedUser)
  })
})))


//make an admin
userRouter.put('/admin', expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.body.id);
  if (user) {
      user.isAdmin = true
  }
  const madeAdmin = await user.save()
  res.json(madeAdmin)
}))

//set user state from inactive to active
userRouter.put('/confirmverification/:id', expressAsyncHandler(async(req,res) =>{
  const user = await User.findById(req.params.id)
  if(user){
    user.isActive = true
  }
  const activeUser = await user.save()
  res.json(activeUser)
}))


//delete a user
// userRouter.delete('/delete', async(req, res) =>{
//   const user = await User.findByIdAndRemove({_id: req.body.id})
//   res.json(user)
// })

module.exports =  userRouter;