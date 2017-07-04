import schemaGql from "./sqlSchema";
import { property, constant } from "lodash";

export const schema = schemaGql;

export const resolvers = {
  Post: {
    postedBy({ postedBy }, _, context) {
      return context.Users.getUserById(postedBy);
    },
    comments({ id }, { limit = -1, offset = 0 }, context) {
      return context.Comments.getCommentsByPostId(id, limit, offset);
    },
    commentCount({ id }, _, context) {
      return context.Comments.getCommentCount(id) || constant(0);
    },
    vote({ id }, _, context) {
      if (!context.user) return { vote_value: 0 };
      return context.Posts.haveVotedForPost(id, context.user.id);
    },
    upvotes({ id }, _, context) {
      return context.Posts.getUpvotesById(id);
    }
  },
  Question: {
    postedBy({ postedBy }, _, context) {
      return context.Users.getUserById(postedBy);
    },
    answers({ id }, { limit = -1, offset = 0 }, context) {
      return context.Answers.getAnswersByQuesId(id, limit, offset);
    },
    answerCount({ id }, _, context) {
      return context.Answers.getAnswerCount(id) || constant(0);
    }
  },
  Vote: {
    votedBy({ votedBy }, _, context) {
      return context.Users.getUserById(votedBy);
    }
  },

  Comment: {
    postedBy({ postedBy }, _, context) {
      return context.Users.getUserById(postedBy);
    }
  }
};
