import { makeExecutableSchema } from "graphql-tools";
import { withFilter } from "graphql-subscriptions";
import { merge } from "lodash";
import rootSchema from "./rootSchema";
import { resolvers as sqlResolvers } from "./sql/schema";
import sqlSchema from "./sql/sqlSchema";
// import { pubsub } from './subscriptions';

console.log(!!sqlSchema, !!sqlResolvers, "existing");
const COMMENT_ADDED_TOPIC = "commentAdded";

const rootResolvers = {
  Query: {
    feed(root, { type, offset, limit }, context) {
      // Ensure API consumer can only fetch 20 items at most
      const protectedLimit = limit < 1 || limit > 20 ? 20 : limit;

      return context.Posts.getForFeed(type, offset, protectedLimit);
    },
    post(root, { postId }, context) {
      return context.Posts.getById(postId);
    },

    currentUser(root, args, context) {
       return context.user || null;
    }
  },
  Mutation: {
    addNewUser(root, { firstName, lastName, username, email, age }, context) {
      return context.Users
        .addNewUser(firstName, lastName, username, email, age)
        .then(id => context.Users.getUserById(id));
    },

    submitPost(root, { title, body }, context) {
      if (!context.user.id) {
        throw new Error("Must be logged in to submit a post.");
      }

      return Promise.resolve()
        .then(() =>
          context.Posts.getByTitle(title).then(post => {
            if (post) return post;
            return Promise.reject("Post item already exists");
          })
        )
        .catch(e => {
          return context.Posts
            .submitPost(title, body, context.user.id)
            .then(([{id}]) => context.Posts.getById(id));
        });
    },

    submitComment(root, { postId, content }, context) {
      // if (!context.user) {
      //   throw new Error("Must be logged in to submit a comment.");
      // }
      return Promise.resolve().then(() =>
        context.Comments.submitComment(postId, content, context.user.id)
      );
      // .then(([id]) => context.Comments.getCommentById(id))
      // .then(comment => {
      //   // publish subscription notification
      //   pubsub.publish(COMMENT_ADDED_TOPIC, { commentAdded: comment });

      //   return comment;
      // });
    },

    vote(root, { postId, type }, context) {
      // if (!context.user) {
      //   throw new Error("Must be logged in to vote.");
      // }
      const voteValue = {
        UP: 1,
        DOWN: -1,
        CANCEL: 0
      }[type];

      return context.Posts
        .submitVote(postId, voteValue, context.user.id)
        .then(() => context.Posts.getById(postId));
    }
  }
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
const fullSchema = [...rootSchema, ...sqlSchema];
const resolvers = merge(rootResolvers, sqlResolvers);

const executableSchema = makeExecutableSchema({
  typeDefs: fullSchema,
  resolvers
});

export default executableSchema;
