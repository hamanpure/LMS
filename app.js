const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
app.use(bodyParser.json());

// eslint-disable-next-line no-unused-vars
const {
  User,
  Report,
  Progress,
  Page,
  Course,
  Enrollment,
  Chapter,
  QuizQuestion,
  QuizOption,
  QuizAnswer,
  Quiz,
} = require("./models");
// eslint-disable-next-line no-unused-vars
const { title } = require("process");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/signup", async (req, res) => {
  console.log("creating a user", req.body);
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    });
    return res.json(user);
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error: "Unable to create user" });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Signin" });
});
app.get("/dashboard", (req, res) => {
  res.render("dashboard", { title: "Dashboard" });
});

app.get("/addcourse", (req, res) => {
  res.render("addcourse", { title: "addcourse" });
});

app.get("/mycourse", (req, res) => {
  res.render("mycourse", { title: "mycourse" });
});

app.get("/editcourse", (req, res) => {
  res.render("editcourse", { title: "editcourse" });
});

app.get("/report", (req, res) => {
  res.render("report", { title: "report" });
});

app.post("/users", (req, res) => {
  res.render("dashboard", { title: "dashboard" });
});
app.get("/continuecourse", (req, res) => {
  res.render("continuecourse", { title: "continue" });
});
app.get("/viewcourse", (req, res) => {
  res.render("viewcourse", { title: "course" });
});
app.get("/user", (req, res) => {
  res.render("user", { title: "user" });
});

app.get("/edituser", (req, res) => {
  res.render("edituser", { title: "edituser" });
});
module.exports = app;
