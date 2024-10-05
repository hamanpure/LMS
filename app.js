const express = require("express");
const app = express()
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// eslint-disable-next-line no-unused-vars
const {User, Report, Progress, Page ,Course ,Enrollment, Chapter, QuizQuestion, QuizOption, QuizAnswer, Quiz, } = require("./models");


app.get("/", (req, res) => {
    res.send("hello")
})

app.post("/signup", async (req, res) => {
    console.log("creating a user", req.body);
    try {
        const user = await User.create({
            name: req.body.name, 
            email: req.body.email,  
            password: req.body.password, 
            role: req.body.role
        });
        return res.json(user);
    } catch (error) {  
        console.log(error);  
        return res.status(422).json({ error: "Unable to create user" }); 
    }
});


// app.post("/educator",(req,res) => {
    
// })

// app.put("",(req,res) => {

// })

// app.put("",(req,res) => {

// })

// app.delete("",(req,res) => {

// })

module.exports = app;
