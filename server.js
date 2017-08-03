import express from "express";
import bodyParser from "body-parser";
import graphqlHTTP from "express-graphql";
import { apolloUploadExpress } from "apollo-upload-server";
import { S3 } from "aws-sdk";
import Knex from "knex";
import Schema from "./lib/graphql/schema";
import {
  Posts,
  Users,
  Comments,
  Answers,
  Questions,
  Events
} from "./lib/graphql/sql/handlers";

const user = {
  id: 1,
  username: "kevin123",
  firstName: "kevin",
  lastName: "wong",
  age: 21,
  email: "kevinwong@email.com",
  reputation: 9000
};

let config = require("./knexfile");
let env = "development";

let knex = Knex(config[env]);
knex.migrate.latest([config]);

// Promise.all([
//    knex.schema.createTable("tag", function(table) {
//       table.increments("id").primary();
//       table.string("tagName").notNullable();
//       table.integer("selectedBy").references("id").inTable("user");
//     })]).then(()=> console.log("added table to schema"))

// knex.schema.createTable("vote", function(table) {
//       table.increments("id").primary();
//       table.integer("vote_value");
//       table.integer("votedBy").references("id").inTable("user");
//       table.integer("postId").unique().references("id").inTable("post");

//     }).then((e)=> console.log("creating vote table " , e))
const app = express();
const PORT = 8016;

app.use(
  "/graphql",
  bodyParser.json(),
  apolloUploadExpress({
    uploadDir: "./uploads"
  })
);
// app.use(/\/((?!graphql).)*/, bodyParser.urlencoded({ extended: true }));
// app.use(/\/((?!graphql).)*/, bodyParser.json());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: Schema,
    graphiql: true,
    context: {
      Users: new Users(),
      Posts: new Posts(),
      Comments: new Comments(),
      Answers: new Answers(),
      Questions: new Questions(),
      Events: new Events(),
      S3: new S3(),
      user
    }
  })
);

app.listen(PORT, function() {
  console.log(`Server listening on port ${PORT} !`);
});
