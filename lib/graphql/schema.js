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
            .then(([{ id }]) => context.Posts.getById(id));
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

    uploadImage(root, { image }, context) {
      const newPath = image.path + "_" + image.name;

      return new Promise((resolve, reject) => {
        rename(image.path, newPath, function(err) {
          if (err) console.log("ERROR: " + err);

          const bucketName = "elasticbeanstalk-ca-central-1-934307702716";
          const keyName = image.name;

          const read = createReadStream(newPath);
          const upload = s3Stream.upload({
            Bucket: bucketName,
            Key: keyName,
            ACL: "public-read"
          });

          // Optional configuration
          upload.maxPartSize(20971520); // 20 MB
          upload.concurrentParts(5);

          // Handle errors.
          upload.on("error", function(error) {
            console.log(error);
            return reject(err);
          });

          /* Handle progress. Example details object:
   { ETag: '"f9ef956c83756a80ad62f54ae5e7d34b"',
     PartNumber: 5,
     receivedSize: 29671068,
     uploadedSize: 29671068 }
*/
          upload.on("part", function(details) {
            console.log(
              `Uploading: ${details.receivedSize}/${details.uploadedSize}`
            );
          });

          /* Handle upload completion. Example details object:
   { Location: 'https://bucketName.s3.amazonaws.com/filename.ext',
     Bucket: 'bucketName',
     Key: 'filename.ext',
     ETag: '"bf2acbedf84207d696c8da7dbb205b9f-5"' }
*/
          upload.on("uploaded", function(details) {
            console.log("Finished Upload", details);
            return resolve(details);
          });

          // Pipe the incoming filestream through compression, and up to S3.
          read.pipe(upload);

          // S3.putObject(params, function(err, data) {
          //   if (err) console.log(err);
          //   else
          //     console.log(
          //       "Successfully uploaded data to " + bucketName + "/" + keyName
          //     );
          // });

          // return Promise.resolve().then(() => "");
        });
        // return Promise.resolve().then(() => "request complete");
      }).then((result)=> JSON.stringify(result));
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
