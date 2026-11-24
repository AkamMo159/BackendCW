const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

//MIDDLEWARE 

app.use(function (request, response, next) {
    console.log(
        "In comes a" + request.method +
        " request to " + request.url
    );

    next();
});

app.use(cors());
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "public", "images"))
);

app.use("/images", function (request, response) {

    response.status(404).send("Error 404: File not found");
});

// MongoDB connection

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri,);

//Starting the server

async function startServer() {

    try {

        await client.connect();

        console.log("Connected to MongoDB successfully");

        //Choosing database
        const db = client.db("lessonstore");

        //Select collections
        const lessonsCollection = db.collection("lessons");
        const ordersCollection = db.collection("orders");

        //GET route
        app.get("/lessons", async function (request, response) {

            try {
                const lessons = await lessonsCollection.find({}).toArray();

                response.json(lessons);

            }
            catch (error) {
                console.log("Error retrieving lessons:", error);

                response.status(500).json({
                    message: "Error retrieving lessons",
                });
            }
        });

        //POST ROUTE

        app.post("/orders", async function (request, response) {
            try {

                const newOrder = {

                    name: request.body.name,

                    phone: request.body.phone,

                    lessons: request.body.lessons,

                    date: new Date(),
                };
                //Saving Order

                const results = await ordersCollection.insertOne(newOrder);

                console.log("New order saved:", results.insertedId);

                response.status(201).json({

                    message: "Order saved successfully",

                    orderId: results.insertedId,
                });
            }
            catch (error) {
                console.log("Error saving order:", error);

                response.status(500).json({
                    message: "Error saving order",
                });
            }
        });

        //PUT ROUTE
        app.put("/lessons/:id", async function(request, response){
            try {
                const lessonsId = new ObjectId(request.params.id);

                const updatedLesson = await lessonsCollection.updateOne(
                    { _id: lessonsId },
                    { $set: request.body }
                );

                if (updatedLesson.matchedCount === 0) {

                    return response.status(404).json({
                        message: "Lesson not found",
                    });
                }
                 
                response.json({
                    message: "Lesson updated successfully",
                });
               }
            catch (error) {
                console.log("Error updating lesson:", error);

                response.status(500).json({
                    message: "Error updating lesson",
                });
            }
        })

        app.listen(3000, function () {
            console.log("Server is running on port 3000");
        });
    }

    catch (error) {

        console.log("Error connecting to MongoDB:", error);
    }
}
//Running the server
startServer();
