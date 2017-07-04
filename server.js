// import glue from "glue";
// import { manifest } from "./config/manifest";
import { graphqlHapi, graphiqlHapi } from "graphql-server-hapi";
import blipp from "blipp";
import Knex from "knex";
import Schema from "./lib/graphql/schema";
import { Posts, Users, Comments , Answers, Questions} from "./lib/graphql/sql/handlers";
import hapi from "hapi";

const user = {
  id: 1,
  username: "kevin123",
  firstName: "kevin",
  lastName: "wong",
  age: 21,
  email: "kevinwong@email.com"
};

let config = require("./knexfile");
let env = "development";

let knex = Knex(config[env]);
knex.migrate.latest([config]);


// Promise.all([
//     knex.schema.createTable("question", function(table) {
//       table.increments("id").primary();
//       table.text("title").notNullable();
//       table.integer("postedBy").references("id").inTable("user");
//       table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
//     }),
//     knex.schema.createTable("answer", function(table) {
//       table.increments("id").primary();
//       table.text("content").notNullable();
//       table.integer("postedBy").references("id").inTable("user");
//       table.integer("quesId").references("id").inTable("question");
//       table.dateTime("createdAt");
//     })]).then(()=> console.log("added tables to schema"))


// knex.schema.createTable("vote", function(table) {
//       table.increments("id").primary();
//       table.integer("vote_value");
//       table.integer("votedBy").references("id").inTable("user");
//       table.integer("postId").unique().references("id").inTable("post");

//     }).then((e)=> console.log("creating vote table " , e))

// knex.table('user').insert({
//   username: 'testusername',
//   firstname: 'testfirst',
//   lastname: 'testlast',
//   email: 'blah@blah.com',
//   age:25
// }).then((e)=>console.log(e))

// knex.schema.createTable('post',(table)=>{
//   table.increments
// })

// Promise.all([
//   knex.schema.dropTableIfExists("vote"),
//   knex.schema.dropTableIfExists("comment"),
//   knex.schema.dropTableIfExists("post"),
//   knex.schema.dropTableIfExists("user")

// ]).then(() => {
//   console.log("destroyed schema");
//   Promise.all([
//     knex.schema.createTable("user", function(table) {
//       table.increments("id").primary();
//       table.string("username").unique();
//       // table.string("password");
//       table.string("firstname");
//       table.string("lastname");
//       table.string("email");
//       table.integer("age");
//       table.timestamp("joinedAt").defaultTo(knex.fn.now());
//     }),

//     knex.schema.createTable("post", function(table) {
//       table.increments("id").primary();
//       table.string("title");
//       table.string("body");
//       table.integer("postedBy").references("id").inTable("user");
//       table.timestamp("createdAt").defaultTo(knex.fn.now());
//     }),

//     knex.schema.createTable("comment", function(table) {
//       table.increments("id").primary();
//       table.string("content");
//       table.integer("postedBy").references("id").inTable("user");
//       table.integer("postId").references("id").inTable("post");
//       table.dateTime("createdAt");
//     }),

//     knex.schema.createTable("vote", function(table) {
//       table.increments("id").primary();
//       table.string("vote_value");
//       table.integer("postId").references("id").inTable("post");
//     })
//   ]).then(() => console.log("rebuilt schema"));
// });

const server = new hapi.Server();

const HOST = "0.0.0.0";
const PORT = 8016;

if (!process.env.PRODUCTION) {
  // manifest.registrations.push({
  //   plugin: {
  //     register: "blipp",
  //     options: {}
  //   }
  // });
  server.register([
    {
      register: blipp,
      options: {}
    }
  ]);
}

// glue.compose(manifest, { relativeTo: __dirname }, (err, server) => {
//   if (err) {
//     console.log('server.register err:', err);
//   }

//   server.start(() => {
//     console.log('✅  Server is listening on ' + server.info.uri.toLowerCase());
//   });
// });

server.connection({
  host: HOST,
  port: PORT
});

server.register([
  {
    register: graphqlHapi,
    options: {
      path: "/graphql",
      graphqlOptions: {
        schema: Schema,
        context: {
          Users: new Users(),
          Posts: new Posts(),
          Comments: new Comments(),
          Answers: new Answers(),
          Questions: new Questions(),
          user
        }
      },
      route: {
        cors: true
      }
    }
  },
  {
    register: graphiqlHapi,
    options: {
      path: "/graphiql",
      graphiqlOptions: {
        endpointURL: "/graphql"
      }
    }
  }
]);

server.start(err => {
  if (err) {
    throw err;
  }
  console.log(`Server running at: ${server.info.uri}`);
});
