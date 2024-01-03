import { createConnection } from "mysql";

const connection = createConnection({
  host: "phpstack-984670-3803318.cloudwaysapps.com",
  user: "skkuwzdmjc",
  password: "24GwuV5D4J",
  database: "skkuwzdmjc",
});

export default connection;

// const { createConnection } = require('mysql');

// const connection = createConnection({
//   host: 'localhost', // Your MySQL host
//   user: 'root', // Your MySQL username
//   password: '', // Your MySQL password
//   database: 'review-auto-reply' // Your MySQL database name
// });

// module.exports = connection;
