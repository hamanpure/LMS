# Learning Management System (LMS)

## Overview

The Learning Management System (LMS) is a web application designed to facilitate online learning and course management. It provides a platform for educators to create and manage courses, chapters, and pages, while students can enroll in courses, complete pages, and track their progress.

## Overview

The Learning Management System (LMS) is a web application designed to facilitate online learning and course management.

![Continue Course Screenshot](./public/LMSscreenshots/continue_course.png)
![Login Page Screenshot](./public/LMSscreenshots/login.png)

## Features

### Educator Role

![Educator Dashboard Screenshot](./public/LMSscreenshots/educator_dashboard.png)

## Features

### Educator Role

- **Course Management**:
  - Add and delete courses.
  - View all courses created by the educator.
- **Chapter Management**:
  - Add and delete chapters within each course.
- **Page Management**:
  - Add and delete pages within each chapter.
- **Reporting**:
  - View reports on all courses created, including the count of enrolled students.

### Student Role

- **Course Enrollment**:
  - Enroll in available courses.
  - View course details without enrolling.
- **Page Completion**:
  - Mark pages as complete to track progress.

### User Management

- Users can edit and delete their accounts.
- A landing page for user authentication (sign in or sign up) is available.

## Technologies Used

- **Backend**:
  - Node.js
  - Express.js
  - Sequelize (ORM for PostgreSQL)
- **Frontend**:
  - EJS (Embedded JavaScript templating)
- **Authentication**:
  - Passport.js (for local authentication)
- **Testing**:
  - Jest
  - Supertest
- **Other Dependencies**:
  - bcrypt (for password hashing)
  - connect-ensure-login (to protect routes)
  - connect-flash (for flash messages)
  - cookie-parser (for handling cookies)
  - tiny-csrf (for CSRF protection)

## Live Demo

You can access the live version of the application [here](https://lms-4um5.onrender.com).

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/HAMANPUREVAIBHAV/LMS.git
   cd LMS

   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   - Create a PostgreSQL database.
   - Update the database configuration in `config/config.json` (if applicable).
   - Run the following commands to set up the database:

   ```bash
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```

4. Start the application:

   ```bash
   npm start
   ```

   For production mode:

   ```bash
   npm run start:prod
   ```

### Running Tests

To run tests, use the following command:

```bash
npm test
```

## Contributing

Contributions are welcome! If you have suggestions or improvements, feel free to fork the repository and submit a pull request.

## License

This project is licensed under the ISC License.

## Author

- **Vaibhav**
