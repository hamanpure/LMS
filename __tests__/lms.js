/* eslint-disable no-undef */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;

// Helper function to extract CSRF token
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

// Helper function to login as an educator or student
const login = async (agent, email, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);

  res = await agent.post("/session").send({
    email,
    password,
    _csrf: csrfToken,
  });
  return res;
};

describe("LMS test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  // Test for Signup
  test("Sign up a new educator", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    res = await agent.post("/users").send({
      name: "Educator User",
      role: "educator",
      email: "educator@test.com",
      password: "password123",
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
  });

  // Test for Login
  test("Login as an educator", async () => {
    await login(agent, "educator@test.com", "password123");

    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
  });

  // Test for Signout
  test("Sign out an educator", async () => {
    await login(agent, "educator@test.com", "password123");

    let res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);

    res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(302); // Should redirect to login since logged out
  });

  test("User Sign Up as a student", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    res = await agent.post("/users").send({
      name: "Test User",
      role: "student", // assuming roles like 'student' or 'educator'
      email: "testuser2@test.com",
      password: "password123",
      _csrf: csrfToken,
    });

    // Expecting redirection to dashboard after successful signup
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/dashboard");
  });

  test("User Sign In as a student", async () => {
    // First, sign up the user (as the user should exist for login to work)
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/users").send({
      name: "Test User",
      role: "student",
      email: "testuser2@test.com",
      password: "password123",
      _csrf: csrfToken,
    });

    // Now, log out if needed and attempt to sign in
    res = await agent.get("/login");
    csrfToken = extractCsrfToken(res);

    res = await agent.post("/session").send({
      email: "testuser2@test.com",
      password: "password123",
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/dashboard");
  });

  test("User Sign Out as a student", async () => {
    // First, log in the user
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);

    res = await agent.post("/session").send({
      email: "testuser2@test.com",
      password: "password123",
      _csrf: csrfToken,
    });

    // Now, log out the user
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/");

    // Check that the user cannot access the dashboard after logging out
    res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(302); // should redirect to login since user is logged out
  });

  //Test to add and delete a course
  test("Test to add and delete a course", async () => {
    const agent = request.agent(server);
    await login(agent, "educator@test.com", "password123");
    // const res = await agent.get("/dashboard");
    // const csrfToken = extractCsrfToken(res);
    let res = await agent.get("/addcourse");
    let csrfToken = extractCsrfToken(res);
    const educator = await db.User.findOne({
      where: { email: "educator@test.com" },
    });
    const response = await agent.post("/addcourse").send({
      name: "Java basics",
      coursediscription: "know about java",
      educator_id: educator.id,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);

    const course = await db.Course.findOne({
      where: {
        educator_id: educator.id,
      },
    });

    const course_id = course.id;
    res = await agent.get("/mycourse");
    const deleted_value = await agent.delete(`/deletecourse/${course_id}`);
    const d = deleted_value ? true : false;
    expect(d).toBe(true);
  });

  //Test to add and delete a chapter

  test("Test to add and delete a chapter", async () => {
    const agent = request.agent(server);
    await login(agent, "educator@test.com", "password123");

    // Step 1: Get CSRF token from the /addcourse page
    let res = await agent.get("/addcourse");
    let csrfToken = extractCsrfToken(res);

    // Step 2: Create a new course
    const educator = await db.User.findOne({
      where: { email: "educator@test.com" },
    });

    let response = await agent.post("/addcourse").send({
      name: "Java Basics",
      coursediscription: "Learn Java from scratch",
      educator_id: educator.id,
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302); // Ensure course creation was successful

    // Step 3: Retrieve the created course from the database
    const course = await db.Course.findOne({
      where: { educator_id: educator.id },
    });

    expect(course).not.toBeNull(); // Ensure course exists

    // Step 4: Get CSRF token from the editcourse page for the newly created course
    res = await agent.get(`/editcourse?course_id=${course.id}`);
    csrfToken = extractCsrfToken(res);

    // Step 5: Add a chapter to the course
    response = await agent.post("/addchapter").send({
      courseId: course.id,
      chapterName: "Introduction to Java",
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302); // Check for successful chapter creation

    // Step 6: Retrieve the created chapter
    const chapter = await db.Chapter.findOne({
      where: { course_id: course.id },
    });

    expect(chapter).not.toBeNull(); // Ensure chapter exists

    // Step 7: Delete the chapter using the course id
    const deleted_value = await agent.delete(`/deletechapter/${chapter.id}`);

    const d = deleted_value ? true : false;
    expect(d).toBe(true);
  });

  //Test to add and delete a page
  test("Test to add and delete a page", async () => {
    const agent = request.agent(server);
    await login(agent, "educator@test.com", "password123");

    // Step 1: Get CSRF token from the /addcourse page
    let res = await agent.get("/addcourse");
    let csrfToken = extractCsrfToken(res);

    // Step 2: Create a new course
    const educator = await db.User.findOne({
      where: { email: "educator@test.com" },
    });

    let response = await agent.post("/addcourse").send({
      name: "Java Basics",
      coursediscription: "Learn Java from scratch",
      educator_id: educator.id,
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302); // Ensure course creation was successful

    // Step 3: Retrieve the created course from the database
    const course = await db.Course.findOne({
      where: { educator_id: educator.id },
    });

    expect(course).not.toBeNull(); // Ensure course exists

    // Step 4: Get CSRF token from the editcourse page for the newly created course
    res = await agent.get(`/editcourse?course_id=${course.id}`);
    csrfToken = extractCsrfToken(res);

    // Step 5: Add a chapter to the course
    response = await agent.post("/addchapter").send({
      courseId: course.id,
      chapterName: "Introduction to Java",
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302); // Check for successful chapter creation

    // Step 6: Retrieve the created chapter
    const chapter = await db.Chapter.findOne({
      where: { course_id: course.id },
    });

    expect(chapter).not.toBeNull(); // Ensure chapter exists

    //add a page
    res = await agent.get(`/editcourse?course_id=${course.id}`);
    csrfToken = extractCsrfToken(res);

    response = await agent.post("/addpage").send({
      chapterId: chapter.id,
      pageName: "Test page",
      content: "Test content",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);

    //delete a page
    const page = await db.Page.findOne({
      where: { chapter_id: chapter.id },
    });

    expect(page).not.toBeNull(); // Ensure chapter exists

    // Step 7: Delete the chapter using the course id
    const deleted_value = await agent.delete(`/deletepage/${page.id}`);

    const d = deleted_value ? true : false;
    expect(d).toBe(true);
  });

  // Test to enroll in a course
  test("Test for the Enrollment in a course", async () => {
    const agent = request.agent(server);
    await login(agent, "educator@test.com", "password123");

    let res = await agent.get("/addcourse");
    let csrfToken = extractCsrfToken(res);
    const educator = await db.User.findOne({
      where: { email: "educator@test.com" },
    });

    const response = await agent.post("/addcourse").send({
      name: "Python basics",
      coursediscription: "know about python",
      educator_id: educator.id,
      _csrf: csrfToken,
    });

    expect(response.statusCode).toBe(302);

    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);

    await login(agent, "testuser2@test.com", "password123");

    // Step 1: Get CSRF token from the dashboard page
    res = await agent.get("/dashboard");
    let csrfToken1 = extractCsrfToken(res);

    // Step 2: Find a course created by the educator
    const course = await db.Course.findOne({
      where: { educator_id: educator.id },
    });
    expect(course).not.toBeNull(); // Ensure the course exists

    // Step 3: Enroll the student in the course
    res = await agent.post("/enrollment").send({
      course_id: course.id,
      _csrf: csrfToken1,
    });

    // // Expect a redirect to the course page after successful enrollment
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/continuecourse/${course.id}`);
  });

  test("Mark page as complete and uncomplete after logging in as a student", async () => {
    // Step 1: Log in as an educator to create a course, chapter, and page
    const agent = request.agent(server);
    await login(agent, "educator@test.com", "password123");

    // Step 2: Create a new course (only one course)
    let res = await agent.get("/addcourse");
    let csrfToken = extractCsrfToken(res);

    const educator = await db.User.findOne({
      where: { email: "educator@test.com" },
    });

    await agent.post("/addcourse").send({
      name: "Node.js Basics",
      coursediscription: "Introduction to Node.js",
      educator_id: educator.id,
      _csrf: csrfToken,
    });

    // Step 3: Retrieve the created course and add a chapter
    const course = await db.Course.findOne({
      where: { educator_id: educator.id },
    });
    res = await agent.get(`/editcourse?course_id=${course.id}`);
    csrfToken = extractCsrfToken(res);

    await agent.post("/addchapter").send({
      courseId: course.id,
      chapterName: "Getting Started with Node.js",
      _csrf: csrfToken,
    });

    // Step 4: Retrieve the created chapter and add a page
    const chapter = await db.Chapter.findOne({
      where: { course_id: course.id },
    });

    res = await agent.get(`/editcourse?course_id=${course.id}`);
    csrfToken = extractCsrfToken(res);

    await agent.post("/addpage").send({
      chapterId: chapter.id,
      pageName: "Introduction to Node.js",
      content: "Content of Node.js page",
      _csrf: csrfToken,
    });

    // Step 5: Log out the educator
    await agent.get("/signout");

    // Step 6: Log in as a student
    await login(agent, "testuser2@test.com", "password123");

    // Step 7: Enroll the student in the course
    res = await agent.get("/dashboard");
    csrfToken = extractCsrfToken(res);
    console.log("------------");
    console.log(csrfToken);

    await agent.post("/enrollment").send({
      course_id: course.id,
      _csrf: csrfToken,
    });

    res = await agent.get("/dashboard");
    csrfToken = extractCsrfToken(res);
    console.log("------------");
    console.log(csrfToken);
    // Step 8: Retrieve the page and mark it as complete
    const page = await db.Page.findOne({
      where: { chapter_id: chapter.id },
    });

    console.log(csrfToken);
    const markCompleteRes = await agent.post(`/mark-complete/${page.id}`).send({
      completed: true, // Mark the page as complete
      _csrf: csrfToken,
    });

    expect(markCompleteRes.statusCode).toBe(200); // Success response

    // Step 9: Verify progress is updated in the database

    const user = await db.User.findOne({
      where: { email: "testuser2@test.com" },
    });
    let progress = await db.Progress.findOne({
      where: {
        student_id: user.id,
        page_id: page.id,
      },
    });

    expect(progress).not.toBeNull(); // Ensure progress is created
    expect(progress.completed).toBe(true); // Ensure page is marked as complete

    //mark as uncheck

    res = await agent.get("/dashboard");
    csrfToken = extractCsrfToken(res);
    console.log("------------");
    console.log(csrfToken);
    const markunCompleteRes = await agent
      .post(`/mark-complete/${page.id}`)
      .send({
        completed: false, // Mark the page as complete
        _csrf: csrfToken,
      });

    expect(markunCompleteRes.statusCode).toBe(200);

    progress = await db.Progress.findOne({
      where: {
        student_id: user.id,
        page_id: page.id,
      },
    });

    expect(progress).not.toBeNull(); // Ensure progress is created
    expect(progress.completed).toBe(false);
  });
});
