const parse = require("pg-connection-string").parse;

const DATABASE_URL =
  // process.env.DATABASE_URL ||
  "localhost:5432" || "testdb.cff9uyot7fx9.ca-central-1.rds.amazonaws.com:5432";

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: "127.0.0.1",
      user: "testdb",
      password: "12345678",
      database: "testdb"
    }
    // client: "pg",
    // connection: Object.assign({}, parse(DATABASE_URL), { ssl: true }),
    // useNullAsDefault: true
  },
  //   test: {
  //     client: "sqlite3",
  //     connection: {
  //       filename: "./test.sqlite3"
  //     },
  //     useNullAsDefault: true
  //   },
  production: DATABASE_URL && {
    client: "pg",
    connection: Object.assign({}, parse(DATABASE_URL), { ssl: true })
  }
};
