// Importing lots of essential stuff
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fileUpload from 'express-fileupload';
import { v4 as uuidv4 } from 'uuid';

// Express setup
const app = express();
app.use(bodyParser.json());
// Configure file uploads: increase max file size for videos and ensure upload path exists
app.use(fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB limit
    createParentPath: true
}));
app.use(express.static('public'));
app.use(expressSession({
    secret: "uhogrkriunfoajeijhovrubnhu42btij4k",
    cookie: {maxAge: 999999999},
    saveUninitialized: true,
    resave: false,
}));

// MongoDB setup
const connectionURI = "mongodb://localhost:27017";
const client = new MongoClient(connectionURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict:false,
        deprecationErrors: true,
    }
})

// Dotenv setup
dotenv.config(".env");

// OpenAI setup
const AI_client = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY
})

// Database collections
const usersCollection = client.db('hackathon').collection('users');
const contentsCollection = client.db('hackathon').collection('contents');
let results;

// Regex patterns for password, email, and phone validation
const passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
const emailRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

// Registration process
app.post('/M01028229/users', async (req, res)=>{
    // Getting the users data
    const newUser = req.body;
    console.log('Registration payload received:', newUser);
    
    // Checking for existing emails and usernames
    const existingEmail = await usersCollection.findOne({email: newUser.email});
    const existingName = await usersCollection.findOne({name: newUser.name});
    
    // Validating user data
    if (!newUser) {
        res.send({registered: false, message: "⚠️ Cannot leave fields empty"});
        return;
    } else if (existingName) { 
        res.send({registered: false, message: "⚠️ Username already in use"});
        return;
    } else if (existingEmail) {
        res.send({registered: false, message: "⚠️ Email already in use."});
        return;
    } else if (newUser.name.length < 3 || newUser.name.length > 15) {
        res.send({registered: false, message: "⚠️ Name must be 3-15 characters long."});
        return;
    } else if (!passwordRegex.test(newUser.password)) { 
        res.send({registered: false, message: "⚠️ Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."});
        return;
    } else if (!emailRegex.test(newUser.email)) { 
        res.send({registered: false, message: "⚠️ Invalid email address!"});
        return;
    } else if (newUser.password !== newUser.confirmPassword) {
        console.warn('Password mismatch:', newUser.password, newUser.confirmPassword);
        res.send({registered: false, message: "⚠️ Passwords do not match!"});
        return;
    } 
    // Sending user data to database (omit the confirmPassword field)
    else {
        const { confirmPassword, ...userToInsert } = newUser;
        results = await usersCollection.insertOne(userToInsert);
        res.send({registered: true, email: userToInsert.email})
        return;
    }
});

// Displaying all registered users
app.get('/M01028229/users', async (req, res)=>{
    // Getting all the users from the database
    results = await usersCollection.find({}).toArray();
    const currentUser = await usersCollection.findOne({ email:req.session.email });

    // Displaying the users
    res.send({users: results, currentUser: req.session.email, following: currentUser?.follows || []});
});

// Check if user is logged in 
app.get('/M01028229/login', (req, res)=> {
    // If the user is logged in then send login as true else send it as false
    if (req.session.email) {
        res.send({login: true, email: req.session.email})
        return;
    }
    res.send({login: false})
});

// Log in process
app.post('/M01028229/login', async (req, res)=>{
    // Get the user
    const user = req.body;

    // Checking if the email and password match for the user
    results = await usersCollection.findOne({$and: [{email: user.email}, {password: user.password}]});

    // If the results are false then return an error message
    if (!results) {
        res.send({login: false, message: "⚠️ Email or password incorrect"});
        return;
    }

    // Store the users name and email and send login as true alongside their email
    req.session.name = results.name;
    req.session.email = user.email;
    res.send({login: true, email: user.email})
});

// Logs out the user
app.delete('/M01028229/login', (req, res)=> {
    req.session.destroy((err)=>{
        if(err){
            res.send({error: true, message: err})
            return;
        } else {
            res.send({login: false})
            return;
        }
    }) 
})

// // Posting content
// app.post('/M01028229/contents', async (req, res)=>{
//     // Checking if user is logged in
//     if (!req.session.email) { 
//         res.send({error: true, message: "⚠️ You need to be logged in to post content"})
//         return;
//     }

//     // Getting the text and image url and storing them
//     const { text, imageURL } = req.body;
//     // Making a prompt to automatically generate a title
//     const prompt = `The user has written this post: ${text}. Make a title for this users post which aligns with the content of the users post and is also relaxing. You are allowed a maximum of 8 words.`

//     // Awaiting a response from AI
//     const response = await AI_client.responses.create({
//         // JSON Schema
//         model: "gpt-5.1",
//         input: prompt,
//         text: {
//             format: {
//                 type: "json_schema",
//                 name: "post_title_response",
//                 schema: {
//                     type: "object",
//                     properties: {
//                         title: {type: "string"}
//                     },
//                     required: ["title"],
//                     additionalProperties: false
//                 }
//             }
//         }
//     });

//     // Storing the title as the parsed response
//     const title = JSON.parse(response.output_text).title;

//     // The content is stored with the users name, email, text for the post, imageurl and title
//     const newContent = {
//         name: req.session.name || "Unknown",
//         email: req.session.email,
//         post: text,
//         imageURL: imageURL || null,
//         title: title,
//     };
    
//     // Add the content to the contents collection and send the users name and their content as response
//     results = await contentsCollection.insertOne(newContent);
//     res.send({name: req.session.name, content: newContent})
// });

// Uploading files
app.post('/M01028229/upload', async (req, res)=>{
    // Accept either `videoFile` (preferred) or `uploadFile` (fallback)
    const uploaded = req.files?.videoFile || req.files?.uploadFile;
    // If no file was uploaded then return an error
    if (!uploaded) {
        res.send({error: true, message: "⚠️ No file uploaded"});
        return;
    }

    // Storing the user's file
    let myFile = uploaded;

    // Validate that the file is a video by extension
    const allowedExt = ['.mp4', '.webm', '.mov', '.mkv'];
    const originalName = myFile.name || '';
    const ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
    if (!allowedExt.includes(ext)) {
        res.status(400).send({error: true, message: '⚠️ Invalid file type. Only video files are allowed.'});
        return;
    }

    // Make the filename unique and keep the original extension
    let uniqueFilename = uuidv4() + ext;

    // Move the file to the uploads folder
    myFile.mv("./public/uploads/" + uniqueFilename, (err) => {
        // If there is an error then send an error as response, else return
        if (err) {
            res.status(500).send({
                filename: myFile.name,
                upload: false,
                error: JSON.stringify(err)
            });
            return;
        }

        // Send the response with the unique file name and upload as true
        res.send({filename: uniqueFilename, upload: true});
    });
});

// // Searching content
// app.get('/M01028229/contents', async (req, res)=>{ 
//     // Checking if the user is logged in
//     if(!req.session.email) { 
//         res.send({error: true, message: "⚠️ You need to be logged in to search"});
//         return;
//     }
    
//     // Getting the current user from the database
//     const user = await usersCollection.findOne({email: req.session.email});
//     // If the user doesnt follow anyone then return results as an empty array
//     if (!user || !user.follows || user.follows.length === 0) {
//         res.send({ results: [] });
//         return;
//     }

//     // Getting the users query
//     const query = req.query.q;

//     // Finding content from the users followers list using the index on the users input
//     const results = await contentsCollection.find({$text: {
//         $search: query},
//         email: { $in: user.follows }
//     }).toArray();

//     // Send the results
//     res.send({results: results});
// });

// =================================
// POTENTIAL FRIEND SYSTEM BELOW??
// =================================

// Following a user
app.post('/M01028229/follow', async (req, res) => {
    // Checking if the user is logged in
    if (!req.session.email) {
        res.send({ error: true, message: "⚠️ You must be logged in" });
        return;
    }

    // Storing the followee
    const followee = req.body.email;

    // If there is no followee then return an error message
    if (!followee) {
        res.send({ error: true, message: "⚠️ Missing follow email" });
        return;
    }

    // Adding the followee to the users follows array
    results = await usersCollection.updateOne({ 
        email: req.session.email 
    },
    { 
        $addToSet: {follows: followee} 
    });

    // Sending a response
    res.send({followed: true, followee});
});

// Unfollowing a user
app.delete('/M01028229/follow', async (req, res) => {
    // Checking if the user is logged in
    if (!req.session.email) {
        res.send({ error: true, message: "⚠️ You must be logged in" });
        return;
    }

    // Storing the followee
    const followee = req.body.email;

    // If there is no followee then return an error message
    if (!followee) {
        res.send({ error: true, message: "⚠️ Missing follow email" });
        return;
    }

    // Removing the followee to the users follows array
    await usersCollection.updateOne({ 
        email: req.session.email 
    },
    { 
        $pull: {follows: followee} 
    });

    // Sending a response
    res.send({unfollowed: true, followee});
});

// Getting users followed list
app.get('/M01028229/follows', async (req, res) => {
    // Checking if the user is logged in
    if (!req.session.email) {
        res.send({ error: true, message: "⚠️ You must be logged in" });
        return;
    }

    // Getting the current user from the database
    const user = await usersCollection.findOne({email: req.session.email});

    // There is no user then send an error message
    if (!user) {
        res.send({error: true, message: "⚠️ User not found"});
        return;
    }

    // Send the users following list
    res.send({follows: user.follows});
});

// AI Chatbot
app.post("/M01028229/chat", async (req, res) => {
    // Storing the text input
    const {text} = req.body;

    // AI prompt
    const prompt = `You are a zen master called Relaxo. The user has said ${text}. Reply in a soothing calming tone that is poetical and relaxing.`
    
    // Awaiting a response from the AI
    const response = await AI_client.responses.create({
        model: "gpt-5.1",
        input: prompt
    })

    // Send the AI's response
    res.send({message: response.output_text});
});

app.listen(8080);
console.log("Listening on 8080");