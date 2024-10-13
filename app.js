const express = require("express");
var csrf = require("tiny-csrf");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;
const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_cheracter_long", ["POST", "PUT", "DELETE"]));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Flash messaging middleware
app.use(flash());

// Configure session middleware
app.use(
  session({
    secret: "my-super-secret-key-23456789098765432",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// Making flash messages available in all templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// Passport LocalStrategy for authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      User.findOne({ where: { email } })
        .then(async (user) => {
          if (!user) {
            return done(null, false, { message: "Invalid email" });
          }

          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => done(error));
    },
  ),
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => done(null, user))
    .catch((error) => done(error, null));
});

// Set EJS as view engine
app.set("view engine", "ejs");

// Import models
const {
  User,
  Report,
  Progress,
  Page,
  Course,
  Enrollment,
  Chapter,
} = require("./models");
// const { where } = require("sequelize");
// const { Where } = require("sequelize/lib/utils");

// Routes
app.get("/", (req, res) => {
  // Check if the user is logged in
  if (req.isAuthenticated()) {
    // Redirect to the dashboard if logged in
    return res.redirect("/dashboard");
  }

  // If not logged in, render the index page
  res.render("index", { title: "LMS Home", csrfToken: req.csrfToken() });
});

// Signup route
app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Signup",
    csrfToken: req.csrfToken(),
    errorMessages: [],
  });
});

// app.post("/users", async (req, res) => {
//   const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);

//   try {
//     const user = await User.create({
//       name: req.body.name,
//       role: req.body.role,
//       email: req.body.email,
//       password: hashedPwd,
//     });

//     req.login(user, (err) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).json({ error: "Login failed" });
//       }
//       res.redirect("/dashboard");
//     });
//   } catch (error) {
//     if (error.name === "SequelizeValidationError") {
//       error.errors.forEach((e) => req.flash("error", e.message));
//       return res.redirect("/signup");
//     }
//     console.log(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// Login route

app.post("/users", async (req, res) => {
  const { name, role, email, password } = req.body;
  const errorMessages = [];

  // Validate input
  if (name.length < 4) {
    errorMessages.push("Name must be at least 4 characters long.");
  }
  if (!["educator", "student"].includes(role)) {
    errorMessages.push("Invalid role selected.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorMessages.push("Please enter a valid email address.");
  }
  if (password.length < 8) {
    errorMessages.push("Password must be at least 8 characters long.");
  }

  // If there are validation errors, re-render the signup page with error messages
  if (errorMessages.length > 0) {
    return res.render("signup", {
      title: "Signup",
      csrfToken: req.csrfToken(),
      errorMessages,
    });
  }

  const hashedPwd = await bcrypt.hash(password, saltRounds);

  try {
    const user = await User.create({
      name,
      role,
      email,
      password: hashedPwd,
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Login failed" });
      }
      res.redirect("/dashboard");
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      error.errors.forEach((e) => req.flash("error", e.message));
      return res.redirect("/signup");
    }
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/login", (req, res) => {
  const errorMessages = req.flash("error");
  res.render("login", {
    title: "Login",
    csrfToken: req.csrfToken(),
    errorMessages,
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/dashboard");
  },
);

// Dashboard route (only accessible if logged in)
app.get("/dashboard", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userName = req.user.name;
    // Fetch the enrolled courses for the current user
    const enrollments = await Enrollment.findAll({
      where: { student_id: userId }, // Assuming student_id corresponds to the user ID
      include: [
        {
          model: Course,
          attributes: ["id", "name", "description"], // Select the desired course fields
          include: [
            {
              model: User,
              attributes: ["name"], // Fetch the educator's name
              as: "educator", // Ensure this matches the association defined in your model
            },
            {
              model: Report,
              attributes: ["student_count"],
              as: "report",
            },
          ],
        },
      ],
    });
    // console.log("--------------------------------")
    // console.log(enrollments[0].Course.dataValues.report[0].dataValues.student_count)
    // console.log(enrollments[0].Course.dataValues.educator.dataValues.name)
    // Fetch any additional data you want to display on the dashboard
    // For example, fetching courses or reports for the logged-in user
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          attributes: ["name"],
          as: "educator",
        },
        {
          model: Report,
          attributes: ["student_count"],
          as: "report",
          required: false, // Allow courses without reports to still be fetched
        },
      ],
    });
    // Log to check output
    // console.log("--------------------------------");
    // console.log(courses[2].dataValues)
    // If the request is for HTML, render the dashboard page
    if (req.accepts("html")) {
      return res.render("dashboard", {
        title: "Dashboard",
        role: userRole,
        name: userName,
        csrfToken: req.csrfToken(),
        courses: courses,
        enrollments: enrollments,
      });
    } else {
      // Otherwise, return the dashboard data as JSON (useful for APIs)
      return res.json({
        role: userRole,
        name: userName,
      });
    }
  } catch (error) {
    console.error("Error rendering dashboard:", error);
    return res.status(422).json({ error: "Error loading dashboard" });
  }
});

// Signout route
app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    // Destroy the session after logout
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
});

// Add Course route
app.get("/addcourse", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.render("addcourse", {
    title: "Add Course",
    csrfToken: req.csrfToken(),
    errorMessages: [],
  });
});

// Add Course POST route
app.post(
  "/addcourse",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const { coursename, coursediscription } = req.body;
    const errorMessages = [];

    // Validate course description length
    if (coursediscription.length <= 5) {
      errorMessages.push("Course description must be more than 5 characters.");
    }

    // If there are validation errors, re-render the addcourse page with error messages
    if (errorMessages.length > 0) {
      return res.render("addcourse", {
        title: "Add Course",
        csrfToken: req.csrfToken(),
        errorMessages, // Pass error messages to the view
      });
    }

    try {
      // Create a new course and associate it with the logged-in educator (user)
      const newCourse = await Course.create({
        name: coursename,
        description: coursediscription,
        educator_id: req.user.id, // Assuming educator_id is the id of the logged-in user
      });

      // After creating the course, redirect to the editcourse page with course id
      return res.redirect(`/editcourse?course_id=${newCourse.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      return res.status(500).json({ error: "Failed to create the course" });
    }
  },
);

// Edit Course route
app.get(
  "/editcourse",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const { course_id } = req.query;

    try {
      const course = await Course.findByPk(course_id, {
        include: [
          {
            model: Chapter, // Assuming you have a Chapter model
            include: [Page], // Include pages if needed
          },
        ],
      });

      if (!course || course.educator_id !== req.user.id) {
        return res.status(403).send("Unauthorized access to this course");
      }

      res.render("editcourse", {
        title: "Edit Course",
        course,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      return res.status(500).json({ error: "Failed to load the course" });
    }
  },
);

// Add a new chapter
app.post(
  "/addchapter",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      // Create a new chapter in the database
      const result = await Chapter.create({
        course_id: req.body.courseId,
        name: req.body.chapterName,
      });

      // Check if the request is an AJAX request (XMLHttpRequest)
      if (
        req.xhr ||
        (req.headers.accept && req.headers.accept.indexOf("json") > -1)
      ) {
        // Return JSON response for AJAX requests
        res.status(201).json({ chapter: result });
      } else {
        // For form submission, redirect to the "edit course" page
        res.redirect(`/editcourse?course_id=${req.body.courseId}`);
      }
    } catch (error) {
      console.error("Error adding chapter:", error);

      if (req.xhr || req.headers.accept.indexOf("json") > -1) {
        // Return error as JSON for AJAX requests
        return res.status(500).json({ error: "Internal server error" });
      } else {
        // For form submission, render the error page or redirect with an error message
        res
          .status(500)
          .redirect(
            `/editcourse/${req.body.courseId}?error=Unable to add chapter`,
          );
      }
    }
  },
);

// Add a new page
app.post("/addpage", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    // Create a new page in the database
    const result = await Page.create({
      chapter_id: req.body.chapterId, // Ensure chapterId is being passed from the form
      name: req.body.pageName, // Name of the page (required)
      content: req.body.content, // Page content (can be empty or an initial value)
    });

    // Check if the request is an AJAX request (XMLHttpRequest)
    if (
      req.xhr ||
      (req.headers.accept && req.headers.accept.indexOf("json") > -1)
    ) {
      // Return JSON response for AJAX requests
      res.status(201).json({ page: result });
    } else {
      // For form submission, redirect to the "edit course" page
      res.redirect(`/editcourse?course_id=${req.body.courseId}`);
    }
  } catch (error) {
    console.error("Error adding page:", error);

    // Handle error for both AJAX and form submissions
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a chapter
app.delete(
  "/deletechapter/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const chapterId = req.params.id;

    try {
      const result = await Chapter.destroy({ where: { id: chapterId } });

      if (result === 0) {
        return res.status(404).json({ error: "Chapter not found." });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete a page
app.delete(
  "/deletepage/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const pageId = req.params.id;

    try {
      const result = await Page.destroy({ where: { id: pageId } });

      if (result === 0) {
        return res.status(404).json({ error: "Page not found." });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update page content
// app.post('/updatepage', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {

//   try {
//       // Update the page content in the database
//       const [updatedRowCount] = await Page.update(
//           { content: req.body.content }, // Set the new content
//           { where: { id: req.body.pageId } } // Condition to find the specific page
//       );

//       // Check if any rows were updated
//       if (updatedRowCount === 0) {
//           return res.status(404).json({ error: "Page not found." });
//       }

//       // Return success response
//       res.json({ success: true, message: "Page content updated successfully." });
//   } catch (error) {
//       console.error('Error updating page content:', error);
//       res.status(500).json({ error });
//   }
// });

app.post(
  "/updatepage",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      // Update the page in the database (you need to implement this function)
      // console.log("-----------------------------------")
      // console.log(req.body.content)
      // console.log(req.body.pageId)
      // console.log("-----------------------------------")
      await Page.update(
        { content: req.body.content },
        {
          where: {
            id: req.body.pageId,
          },
        },
      );
      res.redirect(`/editcourse?course_id=${req.body.courseId}`);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).send("Internal Server Error"); // Handle errors
    }
  },
);

//delete course
app.delete(
  "/deletecourse/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const courseId = req.params.id;

    try {
      // Ensure the course belongs to the logged-in user
      const course = await Course.findOne({
        where: { id: courseId, educator_id: req.user.id },
      });

      if (!course) {
        return res
          .status(404)
          .json({ error: "Course not found or unauthorized." });
      }

      // Delete the course
      await Course.destroy({ where: { id: courseId } });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Other course-related routes
app.get("/mycourse", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    // const allCourses = await Course.getCourse(loggedInUser);

    const allCourses = await Course.findAll({
      where: {
        educator_id: loggedInUser,
      },
      include: [
        {
          model: Report,
          attributes: ["student_count"],
          as: "report", // Ensure 'as' matches the association name defined in your model
          required: false, // Allow courses without reports to still be fetched
        },
      ],
    });

    //console.log(allCourses[0].dataValues.report[0].dataValues.student_count)
    if (req.accepts("html")) {
      res.render("mycourse", {
        title: "My Courses",
        allCourses,
        csrfToken: req.csrfToken(),
      });
    } else {
      return res.json(allCourses);
    }
  } catch (error) {
    console.error("Error updating page:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/user", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const userdetails = await User.findOne({
      where: {
        id: req.user.id, // Correct 'where' clause
      },
    });

    if (!userdetails) {
      return res.status(404).send("User not found");
    }

    // Render the user details page with the retrieved user data
    res.render("user", {
      title: "User Details",
      user: userdetails, // Pass the user details to the template
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).send("Internal Server Error");
  }
});

//enorment route
app.post(
  "/enrollment",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const student_id = req.user.id; // Get the logged-in user's ID
    const course_id = req.body.course_id; // Get the course ID from the request body

    try {
      // Check if the user is already enrolled in the course
      const enrollment = await Enrollment.findOne({
        where: {
          student_id: student_id,
          course_id: course_id,
        },
      });

      if (enrollment) {
        // User is already enrolled; flash a message
        req.flash("error_msg", "You are already enrolled in this course.");
        return res.redirect(`/viewcourse/${course_id}`); // Redirect back to the course view
      }

      // Create a new enrollment record if not already enrolled
      await Enrollment.create({
        student_id: student_id,
        course_id: course_id,
      });

      // Update the report table: check if a report already exists for the course
      let report = await Report.findOne({
        where: { course_id: course_id },
      });

      if (report) {
        // If a report exists, increment the student count
        report.student_count += 1;
        await report.save();
      } else {
        // If no report exists, create a new entry for the course with student count 1
        await Report.create({
          course_id: course_id,
          student_count: 1,
        });
      }

      // Flash success message
      req.flash("success_msg", "You have successfully enrolled in the course.");

      // Redirect to the continue course page after enrollment
      res.redirect(`/continuecourse/${course_id}`);
    } catch (error) {
      console.error("Error enrolling student:", error);
      res.status(500).send("Server Error");
    }
  },
);

// Report route
app.get("/report", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const allCourses = await Course.findAll({
      where: {
        educator_id: req.user.id,
      },
      include: [
        {
          model: Report,
          attributes: ["student_count"],
          as: "report", // Ensure 'as' matches the association name defined in your model
          required: false, // Allow courses without reports to still be fetched
        },
      ],
    });

    res.render("report", {
      title: "Report",
      csrfToken: req.csrfToken(),
      allCourses,
    });
  } catch (error) {
    console.error("Report", error);
    res.status(500).send("Server Error");
  }
});

// Continue course route
// app.get("/continuecourse", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
//   res.render("continuecourse", { title: "Continue Course" });
// });

app.get(
  "/continuecourse/:courseId",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const studentId = req.user.id; // Get the logged-in user's ID (student)

      // Find the course with chapters and pages
      const course = await Course.findOne({
        where: { id: courseId },
        include: [
          {
            model: Chapter,
            include: [Page], // Include pages related to each chapter
          },
        ],
      });

      // Get the educator details
      const educator = await User.findOne({
        where: { id: course.dataValues.educator_id },
      });

      if (!course) {
        return res.status(404).send("Course not found");
      }

      // Get the progress for the student on this course's pages
      const progressRecords = await Progress.findAll({
        where: { student_id: studentId },
        attributes: ["page_id", "completed"], // Get only the page ID and completed status
      });

      // Convert progress records to a simpler map { page_id: completed }
      const progressMap = progressRecords.reduce((acc, record) => {
        acc[record.page_id] = record.completed;
        return acc;
      }, {});

      // Render the course page, passing the course, educator, and progress
      res.render("continuecourse", {
        title: "Continue Course",
        course: course,
        educator: educator,
        progressMap: progressMap, // Pass the progress data to the EJS view
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error("Error loading course:", error);
      return res.status(500).json({ error: "Error loading course" });
    }
  },
);

//mark as complete and uncomplete
app.post(
  "/mark-complete/:pageId",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const studentId = req.user.id; // Logged-in student
      const { pageId } = req.params; // Page ID from the route
      const { completed } = req.body; // Get the completed status from the request body

      // Find the progress record for the student and page
      let progress = await Progress.findOne({
        where: { student_id: studentId, page_id: pageId },
      });

      if (progress) {
        // Update the existing progress record with the new status
        progress.completed = completed;
        await progress.save();
      } else {
        // Create a new progress record if it doesn't exist
        await Progress.create({
          student_id: studentId,
          page_id: pageId,
          completed: completed, // Save the completed status
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating progress:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update progress" });
    }
  },
);

// View course route
// Assuming you have the Course and Chapter models available

app.get(
  "/viewcourse/:course_id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const course_id = req.params.course_id;

    try {
      // Fetch the course by ID
      const enrollment = await Enrollment.findOne({
        where: {
          student_id: req.user.id,
          course_id: course_id,
        },
      });

      if (enrollment) {
        // User is already enrolled; redirect to continuecourse
        return res.redirect(`/continuecourse/${course_id}`);
      }
      const course = await Course.findOne({
        where: { id: course_id },
        include: [
          {
            model: Chapter,
            include: [Page], // Include pages related to each chapter
          },
        ],
      });

      const educator = await User.findOne({
        where: {
          id: course.dataValues.educator_id,
        },
      });
      // console.log("------------------------------");
      // console.log(course.Chapters[0].Pages[0].name);
      if (course) {
        // Render viewcourse.ejs and pass the course and chapters data
        res.render("viewcourse", {
          course,
          chapters: course.Chapters,
          csrfToken: req.csrfToken(),
          educator: educator.dataValues.name,
        });
      } else {
        res.status(404).send("Course not found");
      }
    } catch (error) {
      res.status(500).send("Server Error");
      console.log(error);
    }
  },
);

// Edit user route
app.get("/edituser", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.render("edituser", { title: "Edit User", csrfToken: req.csrfToken() });
});

app.post(
  "/update-user",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const { fullName, email, oldPassword, newPassword, confirmNewPassword } =
      req.body;

    try {
      // Find the logged-in user's current data
      const user = await User.findByPk(req.user.id);

      if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/edituser");
      }

      // Check if the old password is correct
      const validPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validPassword) {
        req.flash("error", "Old password is incorrect.");
        return res.redirect("/edituser");
      }

      // Validate the new password and confirmation
      if (newPassword !== confirmNewPassword) {
        req.flash("error", "New password and confirm password do not match.");
        return res.redirect("/edituser");
      }

      // Hash the new password if provided
      let updatedPassword = user.password;
      if (newPassword && newPassword.length > 0) {
        updatedPassword = await bcrypt.hash(newPassword, saltRounds);
      }

      // Update user details
      await User.update(
        {
          name: fullName,
          email: email,
          password: updatedPassword,
        },
        {
          where: { id: req.user.id },
        },
      );

      // Redirect after successful update
      req.flash("success", "User details updated successfully.");
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Error updating user details:", error);
      req.flash("error", "Internal server error.");
      res.redirect("/edituser");
    }
  },
);

//delete user
app.delete(
  "/delete-user",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      // Find and delete the user by ID
      const result = await User.destroy({
        where: {
          id: req.user.id,
        },
      });

      // If user deletion is successful
      if (result) {
        // Log out the user after deletion
        req.logout((err) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Failed to logout after deletion" });
          }
          // Destroy the session
          req.session.destroy((err) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Failed to destroy session after deletion" });
            }
            return res.json({ success: true });
          });
        });
      } else {
        return res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

module.exports = app;
