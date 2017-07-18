const sqlSchema = [
  `
  type Comment {
  id: ID!  # The SQL ID of this entry
  postedBy: User!# The GitHub user who posted the comment
  createdAt: Float! # A timestamp of when the comment was posted # Actually a date
  content: String! # The text of the comment
  postId: ID!  # The post which this comment is about
}


type Vote {
  vote_value: Int!
  postId: ID!
  votedBy: User!
}


type Post {
  title: String!
  body: String!
  postedBy: User!  # The user who posted this
  createdAt: Float!   # A timestamp of when the entry was submitted # Actually a date
  imageUri: String!
  score: Int!  # The score of this post, upvotes - downvotes
  hotScore: Float!   # The hot score of this post
  comments(limit: Int, offset: Int): [Comment]!   # Comments posted about this post
  commentCount: Int! # The number of comments posted about this post
  id: ID!  # The ID of this post
  vote: Vote!
  upvotes: Int!
}


type Question {
  title: String!
  postedBy: User!  # The user who posted this
  createdAt: Float!   # A timestamp of when the entry was submitted # Actually a date
  answers(limit: Int, offset: Int): [Answer]!   # Answers to this post
  answerCount: Int! # The number of answers to post
  id: ID!  # The ID of this post
}

type Answer {
  id: ID!  # The SQL ID of this entry
  postedBy: User!# The GitHub user who posted the answer
  createdAt: Float! # A timestamp of when the answer was posted # Actually a date
  content: String! # The text of the answer
  quesId: ID!  # The question which this answer is about
}


type User {
  id: ID!
  firstName: String!
  lastName: String!
  username: String!
  age: Int
  email: String,
  joinedAt: Float!
  reputation: Int
}

type Tag {
  id: ID!
  name: String!
  relatedTags: [Tag]!
}
`
];

export default sqlSchema;

// # type Root {
// #    me: User
// #    users(limit: Int = 10, offset: Int): [User]!
// #    following(forUser: ID!, limit: Int = 5,offset: Int): [User]!
// #   #  followers(forUser: ID!, limit: Int = 5 , offset: Int): [User]!
// #    feed(type: NEW, limit: 5)

// # }

// # type Location {
// #   city: String
// #   country: String
// #   state: String
// #   postalCode: String
// # }

// # ---------
