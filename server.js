const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

const ACTIVITIES_COLLECTION = "activities";

const app = express();
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(
	process.env.MONGODB_URI || "mongodb://localhost:27017/test",
	{ useNewUrlParser: true } ,
	function (err, client) {
						if (err) {
							console.log(err);
							process.exit(1);
						}

						// Save database object from the callback for reuse.
						db = client.db();
						console.log("Database connection ready");

						// Initialize the app.
						const server = app.listen(process.env.PORT || 8080, function () {
							const port = server.address().port;
							console.log("App now running on port", port);
						});
});



// API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
	console.log("ERROR: " + reason);
	res.status(code || 500).json({"error": message});
}

/*  "/api/activities"
 *    GET: finds all contacts
 *    POST: creates a new contact
 *
 *  Activity Object
 *    {
 *      id: 1,
 *      type: [ workout, studying, working, reading, watching ],
 *      summary: "Watching React Conf 2018",
 *      link: [ link to summary ],
 *    }
 *
 */

app.get("/api/activities", function(req, res) {
	db.collection(ACTIVITIES_COLLECTION).find({}).toArray(function(err, docs) {
		if (err) {
			handleError(res, err.message, "Failed to get contacts.");
		} else {
			res.status(200).json(docs);
		}
	});
});

/*
* Get the latest activity recorded
*
* */
app.get("/api/activities/current", function(req, res) {
	db.collection(ACTIVITIES_COLLECTION)
		.find({})
		.sort({ $natural: -1 })
		.limit(1)
		.toArray((err, docs) => {
			if (err) {
				handleError(res, err.message, "Failed to get the latest activity.");
			} else {
				res.status(200).json(docs);
			}
		});
});

app.post("/api/activities", function(req, res) {
	const newActivity = req.body;
	newActivity.createDate = new Date();

	if (!req.body.summary) {
		handleError(res, "Invalid user input", "Must provide a summary.", 400);
	} else {
		db.collection( ACTIVITIES_COLLECTION )
			.insertOne( newActivity, (err, doc) => {
				if (err) {
					handleError(res, err.message, "Failed to create new contact.");
				} else {
					res.status(201).json(doc.ops[0]);
				}
			});
	}
});


