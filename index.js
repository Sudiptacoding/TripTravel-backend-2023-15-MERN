const express = require('express')
require('dotenv').config()
var cors = require('cors')
var jwt = require('jsonwebtoken');
const app = express()
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sm8afkk.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const database = client.db("Assignment12");
        const userCollection = database.collection("users");
        const allPackage = database.collection("package");
        const userStory = database.collection("story");
        const guidePost = database.collection("guidePost");
        const loveServices = database.collection("loveproduct");
        const bookingServices = database.collection("bookingservices");
        const userrating = database.collection("userrating");

        // Create Token
        app.post('/jwt', (req, res) => {
            try {
                const token = jwt.sign(req.body, process.env.SEQUIRITY, { expiresIn: '1h' });
                res.send({ token })
            } catch (error) {
                console.log(error)
            }
        })

        // Verify
        const VerifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "unAuthorize access" })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.SEQUIRITY, function (err, decoded) {
                if (err) {
                    return res.status(401).send({ message: "unAuthorize access" })
                }
                req.decoded = decoded;
                next()
            });
        }

        // Verify admin
        const VerifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: "forbidden access" })
            }
            next()
        }

        // Save all User
        app.post('/user', async (req, res) => {
            const email = await userCollection.findOne({ email: req.body.email })
            if (email) {
                return res.send({ sucess: true })
            }
            const result = await userCollection.insertOne(req.body)
            res.send(result)
        })

        // Check Admin or not
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send(admin)
        })
        // Check Ture gide or not 
        app.get('/turegideIsValid/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let admin = false;
            if (user) {
                admin = user?.role === 'Tour Guide';
            }
            res.send(admin)
        })

        // All Users Gate
        app.get('/allUsers', VerifyToken, VerifyAdmin, async (req, res) => {
            const user = await userCollection.find().toArray();
            res.send(user)
        })


        // All Users Gate
        app.get('/turegide', async (req, res) => {
            const user = await userCollection.find().toArray();
            const findGuide = user.filter(item => item.role === 'Tour Guide')
            res.send(findGuide)
        })

        // All Services Gate
        app.get('/allservices', async (req, res) => {
            const user = await allPackage.find().toArray();
            res.send(user)
        })

        // Single Data Gate
        app.get('/servicedetails/:id', VerifyToken, async (req, res) => {
            const user = await allPackage.findOne({ _id: new ObjectId(req.params.id) })
            res.send(user)
        })

        // Admin Save Services
        app.post('/addpackage', VerifyToken, VerifyAdmin, async (req, res) => {
            const result = await allPackage.insertOne(req.body)
            res.send(result)
        })

        // Booking Services
        app.post('/servicesbooking', VerifyToken, async (req, res) => {
            const result = await bookingServices.insertOne(req.body)
            res.send(result)
        })

        // Booking Services gate
        app.get('/servicesbooking', VerifyToken, async (req, res) => {
            const result = await bookingServices.find({ buyUserEmail: req.query.email }).toArray()
            res.send(result)
        })
        // All Assign toure
        app.get('/assigntour', VerifyToken, async (req, res) => {
            const result = await bookingServices.find({ email: req.query.email }).toArray()
            res.send(result)
        })
        // Assign status change
        app.patch('/statusChange', VerifyToken, async (req, res) => {
            const filter = { _id: new ObjectId(req.query.id) };
            const updateDoc = {
                $set: {
                    status: req.query.status
                },
            };
            const result = await bookingServices.updateOne(filter, updateDoc);
            res.send(result)
        })

        // All Love Services
        app.post('/loveservices', VerifyToken, async (req, res) => {
            const result = await loveServices.insertOne(req.body)
            res.send(result)
        })
        // All Love Gate
        app.get('/loveservices/:email', VerifyToken, async (req, res) => {
            const result = await loveServices.find({ userEmail: req.params.email }).toArray()
            res.send(result)
        })
        // All Love delete
        app.delete('/loveservices/:id', VerifyToken, async (req, res) => {
            const result = await loveServices.deleteOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
        })

        // Delet Bookings
        app.delete('/deletbooking/:id', VerifyToken, async (req, res) => {
            const result = await bookingServices.deleteOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
        })


        // User Role Change
        app.patch('/user', VerifyToken, VerifyAdmin, async (req, res) => {
            const email = req.query.email
            const role = req.query.role
            const filter = { email: email };
            const updateDoc = {
                $set: {
                    role: role
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        // User Story Post
        app.post('/userstory', VerifyToken, async (req, res) => {
            const result = await userStory.insertOne(req.body)
            res.send(result)
        })
        // User Story get
        app.get('/userstory', async (req, res) => {
            const result = await userStory.find().toArray()
            res.send(result)
        })

        // Guide post
        app.post('/guidePost', VerifyToken, async (req, res) => {
            const result = await guidePost.insertOne(req.body)
            res.send(result)
        })

        // Guide comment post
        app.post('/userreview', VerifyToken, async (req, res) => {
            const result = await userrating.insertOne(req.body)
            res.send(result)
        })

        // Guide comment  get
        app.get('/userreview', VerifyToken, async (req, res) => {
            const result = await userrating.find({ guide: req.query.email }).toArray()
            res.send(result)
        })
        // Single type data
        app.get('/touretype', VerifyToken, async (req, res) => {
            const result = await allPackage.find({ category: req.query.type }).toArray()
            res.send(result)
        })

        // Get Guide Data
        app.get('/allguideData', async (req, res) => {
            const result = await guidePost.find({ userEmail: req.query.email }).toArray()
            res.send(result)
        })

        // Get story Data
        app.get('/story/:id', VerifyToken, async (req, res) => {
            const result = await userStory.findOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})