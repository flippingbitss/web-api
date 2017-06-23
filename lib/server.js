import glue from "glue";
import { manifest } from "./config/manifest";
import { graphqlHapi,graphiqlHapi } from "graphql-server-hapi";
import Knex from "knex";
import Schema from "./graphql/schema";
import { Posts, Users, Comments } from "./graphql/sql/handlers";

let config = require("./knexfile");
let env = "development";

let knex = Knex(config[env]);
knex.migrate.latest([config]);

// if (!process.env.PRODUCTION) {
//   manifest.registrations.push({
//     plugin: {
//       register: "blipp",
//       options: {}
//     }
//   });
// }

// // manifest.registrations.push({
// //       plugin: {graphqlHapi},
// //       options: {
// //         path: "/graphql",
// //         graphqlOptions: {
// //           schema: Schema,
// //           context: {
// //             Users: new Users(),
// //             Posts: new Posts(),
// //             Comments: new Comments()
// //           }
// //         }
// //       }
// //     })

// glue.compose(manifest, { relativeTo: __dirname }, (err, server) => {
//   if (err) {
//     console.log('server.register err:', err);
//   }

// server.register(graphqlHapi, { path: "/graphql",
//         graphqlOptions: {
//           schema: Schema,
//           context: {
//             Users: new Users(),
//             Posts: new Posts(),
//             Comments: new Comments()
//           }
//         }})

//   server.start(() => {
//     console.log('✅  Server is listening on ' + server.info.uri.toLowerCase());
//   });
// });

import hapi from "hapi";
const server = new hapi.Server();

const HOST = "localhost";
const PORT = 8010;

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
            Comments: new Comments()
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
