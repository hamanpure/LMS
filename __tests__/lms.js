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
});
