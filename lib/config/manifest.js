// import Schema from "../graphql/schema";
// import { Posts, Users, Comments } from "../graphql/sql/handlers";
// import { graphqlHapi } from 'graphql-server-hapi';

// const pg_connection_string =
//   "testdb.cff9uyot7fx9.ca-central-1.rds.amazonaws.com:5432";

// const envKey = key => {
//   const env = process.env.NODE_ENV || "development";

//   const configuration = {
//     development: {
//       host: "localhost",
//       port: 8000,
//       pg_connection_string
//     },
//     // These should match environment variables on hosted server
//     production: {
//       host: process.env.HOST,
//       port: process.env.PORT,
//       pg_connection_string
//     }
//   };

//   return configuration[env][key];
// };

// export const manifest = {
//   connections: [
//     {
//       host: envKey("host"),
//       port: envKey("port"),
//       routes: {
//         cors: true
//       },
//       router: {
//         stripTrailingSlash: true
//       }
//     }
//   ],
//   registrations: [
//     {
//       plugin: "hapi-auth-jwt2"
//     },
//     {
//       plugin: "./api/middleware/auth/auth"
//     },
//     {
//       plugin: "./api",
//       options: { routes: { prefix: "/api" } }
//     },
    
//     {
//       plugin: {
//         register: "good",
//         options: {
//           ops: { interval: 60000 },
//           reporters: {
//             console: [
//               {
//                 module: "good-squeeze",
//                 name: "Squeeze",
//                 args: [{ error: "*" }]
//               },
//               { module: "good-console" },
//               "stdout"
//             ]
//           }
//         }
//       }
//     }
//   ]
// };
