import schemaGql from "./sqlSchema";
import { property, constant } from "lodash";

export const schema = schemaGql

export const resolvers = {
  Post: {
    postedBy({ postedBy }, _, context) {
      return context.Users.getByUsername(postedBy);
    },
    comments({ postId }, { limit = -1, offset = 0 }, context) {
      return context.Comments.getCommentsByPostId(postId, limit, offset);
    },
    title: property("title"),
    body: property("body"),
    createdAt: property("createdAt"),
    hotScore: property("hotScore"),
    commentCount({ postId }, _, context) {
      return context.Comments.getCommentCount(postId) || constant(0);
    },
    vote({ postId }, _, context) {
      if (!context.user) return { vote_value: 0 };
      return context.Posts.haveVotedForPost(postId, context.user.username);
    }
  },
  User: {
    joinedAt: property("joinedAt")
  },

  Comment: {
    createdAt: property("createdAt"),
    postedBy({ postedBy }, _, context) {
      return context.Users.getByUsername(postedBy);
    }
  }
};
