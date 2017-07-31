import { makeExecutableSchema } from "graphql-tools";
import { withFilter } from "graphql-subscriptions";
import { merge } from "lodash";
import rootSchema from "./rootSchema";
import { resolvers as sqlResolvers } from "./sql/schema";
import sqlSchema from "./sql/sqlSchema";
import { rename, createReadStream } from "fs";
import { S3 } from "aws-sdk";
import s3StreamClient from "s3-upload-stream";

const s3Stream = s3StreamClient(new S3());
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
    questions(root, { type, offset, limit }, context) {
      // Ensure API consumer can only fetch 20 items at most
      const protectedLimit = limit < 1 || limit > 20 ? 20 : limit;

      return context.Questions.getForFeed(type, offset, protectedLimit);
    },
    question(root, { quesId }, context) {
      return context.Questions.getById(quesId);
    },
    allPostsFromUser(root, { postedById, offset, limit }, context) {
      // Ensure API consumer can only fetch 20 items at most
      const protectedLimit = limit < 1 || limit > 20 ? 20 : limit;
      return context.Posts.getAllByUserId(postedById, offset, protectedLimit);
    },
    allAnswersFromUser(root, {postedById, offset, limit }, context){
      // Ensure API consumer can only fetch 20 items at most
      const protectedLimit = limit < 1 || limit > 20 ? 20 : limit;
      return context.Answers.getAllAnswersByUserId(postedById, offset, protectedLimit);
    },
    search(root, {query}, context){
      return context.Posts.search(query)
    },
    currentUser(root, args, context) {
      return context.user || null;
    }
  },
  Mutation: {
    addNewUser(root, { firstName, lastName, username, email, age, gender,education, occupation }, context) {
      return context.Users
        .addNewUser(firstName, lastName, username, email, age, gender, education, occupation)
        .then(id => context.Users.getUserById(id));
    },

    submitPost(root, { title, body, image }, context) {
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
            .uploadImage(image).then((imageUri) => context.Posts.submitPost(title, body, imageUri, context.user.id))
            .then(([{ id }]) => {
              return context.Users.updateReputation(context.user.id)
              .then(()=>context.Posts.getById(id))
            });
        });
    },

    submitQuestion(root, { title }, context) {
      if (!context.user.id) {
        throw new Error("Must be logged in to submit a question.");
      }

      return Promise.resolve()
        .then(() =>
          context.Questions.getByTitle(title).then(question => {
            if (question) return question;
            return Promise.reject("Question item already exists");
          })
        )
        .catch(e => {
          return context.Questions
            .submitQuestion(title, context.user.id)
            .then(([{ id }]) => context.Questions.getById(id));
        });
    },
    submitAnswer(root, { quesId, content }, context) {
      // if (!context.user) {
      //   throw new Error("Must be logged in to submit a comment.");
      // }
      return Promise.resolve().then(() =>
        context.Answers.submitAnswer(quesId, content, context.user.id)
      );
      // .then(([id]) => context.Comments.getCommentById(id))
      // .then(comment => {
      //   // publish subscription notification
      //   pubsub.publish(COMMENT_ADDED_TOPIC, { commentAdded: comment });

      //   return comment;
      // });
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
    },
  }
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
