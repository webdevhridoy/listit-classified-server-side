const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { query } = require('express');

// payment for stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//middleware
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
};
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xetzjun.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    // console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    // console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Access forbidden' });
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {

    try {
        const productsCollections = client.db('classified').collection('products');
        const usersCollections = client.db('classified').collection('users');
        const categoryCollections = client.db('classified').collection('categories');
        const bookingsCollections = client.db('classified').collection('bookings');
        const paymentsCollection = client.db('classified').collection('payments');
        const wishlistCollection = client.db('classified').collection('wishlist');
        const adsCollection = client.db('classified').collection('ads');
        // console.log(productsCollections);

        const verifyAdmin = async (req, res, next) => {
            // console.log('inside of verifyAdmin', req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollections.findOne(query);
            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        };


        // jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '15d' });
            res.send({ token });
        });

        // app.get('/jwt', async (req, res) => {
        //     const email = req.query.email;
        //     const query = { email: email };
        //     const user = await usersCollections.findOne(query);
        //     console.log(user);
        //     if (user) {
        //         const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
        //         return res.send({ accessToken: token });
        //     }
        //     res.status(403).send({ accessToken: '' });
        // });


        app.get('/advertisement', async (req, res) => {
            const query = {};
            const cursor = await adsCollection.find(query).toArray();
            res.send(cursor);
        });

        // app.put('/advertisement', async (req, res) => {
        //     const ads = req.body;
        //     const result = await adsCollection.insertOne(ads);
        //     res.send(result);
        // });

        app.post('/advertisement', async (req, res) => {
            const ads = req.body;
            const updatedResult = await adsCollection.insertOne(ads);
            res.send(updatedResult);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = await usersCollections.find(query).toArray();
            res.send(cursor);
        });

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollections.deleteOne(filter);
            res.send(result);
        });


        app.get('/products/:categoryId', async (req, res) => {
            const categoryId = req.params.categoryId;
            const query = { categoryId };
            const product = await productsCollections.find(query).toArray();
            res.send(product);
        });
        // app.get('/products/:categoryId', async (req, res) => {
        //     const categoryId = req.params.categoryId;
        //     const query = { categoryId };
        //     const product = await productsCollections.find(query).toArray();
        //     res.send(product);
        // });
        app.get('/allproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollections.findOne(query);
            res.send(product);
        });
        // app.get('/allproducts/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const product = await productsCollections.findOne(query);
        //     res.send(product);
        // });


        app.get('/products', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            // console.log(decoded);
            if (decoded.email !== req.query?.email) {
                return res.status(403).send({ message: 'Unauthorized Access' });
            }
            let query = {};
            if (req.query?.email) {
                query = {
                    email: req.query?.email
                };
            }
            // console.log(query);
            const cursor = productsCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const booking = { _id: ObjectId(id) };
            const result = await bookingsCollections.findOne(booking);
            res.send(result);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query?.email) {
                return res.status(403).send({ message: 'Unauthorized Access' });
            }
            let query = {};
            if (req.query?.email) {
                query = {
                    email: req.query?.email
                };
            }
            const cursor = bookingsCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        app.post('/bookings', async (req, res) => {
            const product = req.body;
            const result = await bookingsCollections.insertOne(product);
            res.send(result);
        });

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bookingsCollections.deleteOne(filter);
            res.send(result);
        });

        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoryCollections.find(query).toArray();
            res.send(result);
        });
        // app.get('categories/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await cate.findOne(query);
        //     res.send(result);
        // });

        app.post('/categories', async (req, res) => {
            const category = req.body;
            const result = await categoryCollections.insertOne(category);
            res.send(result);
        });


        app.get('/categories/:category', async (req, res) => {
            const category = req.params.category;
            const query = { category };
            const allCategory = await productsCollections.find(query).toArray();
            res.send(allCategory);

        });

        // for sellers
        app.get('/users/seller', async (req, res) => {
            const query = { role: 'Seller' };
            const user = await usersCollections.find(query).toArray();
            res.send(user);
        });

        app.put('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'Verified'
                }
            };
            const result = await usersCollections.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.put('/users/updateseller/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'Verified'
                }
            };
            const result = await productsCollections.updateMany(filter, updatedDoc, options);
            res.send(result);
        });

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollections.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        });

        // for buyer
        app.get('/users/buyer', async (req, res) => {
            const query = { role: 'Buyer' };
            const user = await usersCollections.find(query).toArray();
            res.send(user);
        });
        // for admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollections.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            res.send(result);
        });

        // for making admin 
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'Admin'
                }
            };
            const result = await usersCollections.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollections.insertOne(product);
            res.send(result);
        });

        app.delete('/allproducts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollections.deleteOne(filter);
            res.send(result);
        });



        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const productprice = booking.productprice;
            // console.log(productprice);
            const amount = productprice * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                'payment_method_types': [
                    'card'
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            });

        });

        app.post('/create-payment-intents', async (req, res) => {
            const booking = req.body;
            const productprice = booking.productprice;
            // console.log(productprice);

            const amount = 10 * 100;
            // console.log(amount);

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                'payment_method_types': [
                    'card'
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            });

        });

        // app.put('/wishPayment', async (req, res) => {
        //     const payment = req.body;
        //     const result = await paymentsCollection.insertOne(payment);
        //     const wishId = payment.bookingId;
        //     const wishFilter = { bookingId: wishId };
        //     console.log(wishFilter);
        //     const wishUpdatedDoc = {
        //         $set: {
        //             paid: true,
        //             availability: true,
        //             transactionId: payment.transactionId,
        //         }
        //     };
        //     const wishProducts = await wishlistCollection.updateOne(wishFilter, wishUpdatedDoc, options);
        //     res.send({ result, wishProducts });
        // });

        app.put('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingsId;
            const filter = { _id: ObjectId(id) };
            // console.log('inside of payments', filter);
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    paid: true,
                    availability: true,
                    transactionId: payment.transactionId,
                }
            };
            const ids = payment.bookingId;
            const filters = { _id: ObjectId(ids) };
            const updatedDocs = {
                $set: {
                    paid: true,
                    availability: true,
                    transactionId: payment.transactionId,
                }
            };

            // for ads collection
            const ads = payment.bookingId;
            const adFilter = { bookingId: ads };
            // console.log(adFilter);
            const adsUpdateDoc = {
                $set: {
                    paid: true,
                    availability: true,
                    transactionId: payment.transactionId,
                }
            };

            // for wishlist

            const wishId = payment.bookingId;
            const wishFilter = { bookingId: wishId };
            // console.log(wishFilter);
            const wishUpdatedDoc = {
                $set: {
                    paid: true,
                    availability: true,
                    transactionId: payment.transactionId,
                }
            };

            const updatedResult = await bookingsCollections.updateOne(filter, updatedDoc, options);
            const myProducts = await productsCollections.updateOne(filters, updatedDocs, options);
            const adsProduct = await adsCollection.updateOne(adFilter, adsUpdateDoc, options);
            const wishProducts = await wishlistCollection.updateOne(wishFilter, wishUpdatedDoc, options);
            res.send({ result, updatedResult, myProducts, adsProduct, wishProducts });
        });
        // app.put('/payment', async (req, res) => {
        //     const payment = req.body;
        //     const result = await paymentsCollection.insertOne(payment);
        //     const id = payment.bookingId;
        //     const filter = { _id: ObjectId(id) };
        //     console.log('inside of payment', filter);
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             paid: true,
        //             availability: true,
        //             transactionId: payment.transactionId,
        //         }
        //     };
        //     // const updatedResult = await bookingsCollections.updateOne(filter, updatedDoc, options);
        //     const myProducts = await productsCollections.updateOne(filter, updatedDoc, options);
        //     res.send({ result, myProducts });
        // });

        app.get('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const wishlist = { _id: ObjectId(id) };
            const result = await wishlistCollection.findOne(wishlist);
            res.send(result);
        });


        app.get('/wishlist', async (req, res) => {
            const query = {};
            const wishlist = await wishlistCollection.find(query).toArray();
            res.send(wishlist);
        });

        app.post('/wishlist', async (req, res) => {
            const wishlist = req.body;
            const result = await wishlistCollection.insertOne(wishlist);
            res.send(result);
        });

        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const wishlist = { _id: ObjectId(id) };
            const result = await wishlistCollection.findOne(wishlist);
            res.send(result);
        });


    }
    finally {

    }

}
run().catch(error => console.error(error));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});