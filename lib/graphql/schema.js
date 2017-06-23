import { makeExecutableSchema } from "graphql-tools";
import { withFilter } from "graphql-subscriptions";
import { merge } from "lodash";
import rootSchema from "./rootSchema";
import { resolvers as sqlResolvers } from "./sql/schema";
import sqlSchema from "./sql/sqlSchema";
// import { pubsub } from './subscriptions';


console.log(!!sqlSchema, !!sqlResolvers, "existing")
const COMMENT_ADDED_TOPIC = "commentAdded";

const rootResolvers = {
  Query: {
    feed(root, { type, offset, limit }, context) {
      // Ensure API consumer can only fetch 20 items at most
      const protectedLimit = limit < 1 || limit > 20 ? 20 : limit;

      return context.Posts.getForFeed(type, offset, protectedLimit);
    },
    post(root, { repoFullName }, context) {
      return context.Posts.getByRepoFullName(repoFullName);
     },
    // currentUser(root, args, context) {
    //   return context.user || null;
    // }
  },
  // Mutation: {
  //   submitpost(root, { repoFullName }, context) {
  //     if (!context.user) {
  //       throw new Error("Must be logged in to submit a post.");
  //     }

  //     return Promise.resolve()
  //       .then(() =>
  //         context.Repositories.getByFullName(repoFullName).catch(() => {
  //           throw new Error(`Couldn't find post named "${repoFullName}"`);
  //         })
  //       )
  //       .then(() => context.Posts.submitpost(repoFullName, context.user.login))
  //       .then(() => context.Posts.getByRepoFullName(repoFullName));
  //   },

  //   submitComment(root, { repoFullName, commentContent }, context) {
  //     if (!context.user) {
  //       throw new Error("Must be logged in to submit a comment.");
  //     }
  //     return Promise.resolve()
  //       .then(() =>
  //         context.Comments.submitComment(
  //           repoFullName,
  //           context.user.login,
  //           commentContent
  //         )
  //       )
  //       .then(([id]) => context.Comments.getCommentById(id))
  //       .then(comment => {
  //         // publish subscription notification
  //         pubsub.publish(COMMENT_ADDED_TOPIC, { commentAdded: comment });

  //         return comment;
  //       });
  //   },

  //   vote(root, { repoFullName, type }, context) {
  //     if (!context.user) {
  //       throw new Error("Must be logged in to vote.");
  //     }

  //     const voteValue = {
  //       UP: 1,
  //       DOWN: -1,
  //       CANCEL: 0
  //     }[type];

  //     return context.Posts
  //       .voteForEntry(repoFullName, voteValue, context.user.login)
  //       .then(() => context.Posts.getByRepoFullName(repoFullName));
  //   }
  // },
  // Subscription: {
  //   commentAdded: {
  //     subscribe: withFilter(
  //       () => pubsub.asyncIterator(COMMENT_ADDED_TOPIC),
  //       (payload, args) => {
  //         return payload.commentAdded.post_name === args.repoFullName;
  //       }
  //     )
  //   }
  // }
};

// Put schema together into one array of schema strings
// and one map of resolvers, like makeExecutableSchema expects
const fullSchema = [...rootSchema,...sqlSchema];
const resolvers = merge(rootResolvers, sqlResolvers);

const executableSchema = makeExecutableSchema({
  typeDefs: fullSchema,
  resolvers
});

export default executableSchema;
