const functions = require("firebase-functions");

/* eslint-disable no-undef */
const express = require('express')
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
//const chats = require('./data/data.js')

const userRouter  = require('./routers/userRouter.js');
const productRouter = require('./routers/productRouter.js');
const orderRouter = require('./routers/orderRouter.js');
const storeRouter = require('./routers/storeRouter.js');
const withdrawRouter = require('./routers/withdrawRouter.js')
const chatRouter = require('./routers/chatRouter.js');
const messageRouter = require('./routers/messageRouter.js');
const rejectionRouter = require('./routers/rejectionRouter.js');
const feedbackRouter = require('./routers/feedbackRouter.js');
const Mosgandastore = require('./models/storeModel.js');

dotenv.config();
const app = express();


//Connect to mongoDb
// mongoose.connect(process.env.MONGODB_CONNECT,{
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }, ()=>{
//     console.log("Connected to local db")
// })
//connect to db
mongoose.connect(process.env.CONNECT_TO_DB,{ useNewUrlParser: true, useUnifiedTopology: true },()=>{
    console.log('connected to db')
})

//backend address: https://us-central1-mosganda-one-7604d.cloudfunctions.net/app

//express middlewares
app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

// var distDir = __dirname + "/dist/";
//  app.use(express.static(distDir));
//for file uploads
app.use('/uploads', express.static('uploads'))

app.use('/api/v1/user', userRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/order', orderRouter)
app.use('/api/v1/store', storeRouter)
app.use('/api/v1/withdraw', withdrawRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/message', messageRouter)
app.use('/api/v1/reject', rejectionRouter)
app.use('/api/v1/feedback', feedbackRouter)

//api for paystack key
app.get('/api/v1/config/paystack', (req, res) =>{
    // eslint-disable-next-line no-undef
    res.json(process.env.MOSGANDA_PAYSTACK_PUBLIC_KEY) //sb stands for sandbox
})

app.get('/', (req, res)=>{
    res.send("Server is ready");
})

app.get('/:storename', async (req, res) => {

    const mystore = await Mosgandastore.find({  businessName: { $regex: req.params.storename, $options: "i" } });
    if (!mystore) {
        return res.json("Store not found")
    } else {
        return res.json(mystore[0])
    }

})

// app.get('/', expressAsyncHandler(async (req, res) => {

//     const products = await Product.find({isPosted: true, isPaid: false}).sort({ updatedAt: -1 });
//     res.json(products);
// }))
//to show errors
app.use((err, req, res, next) =>{
    res.status(500).json({
        message: err.message
    })
    next()
})
//const port = process.env.PORT || 4000
app.listen(5000, () => {
    console.log(`Serve as http://localhost:5000`)
})




exports.app = functions.https.onRequest(app);