const rootSchema = [
  `
# A list of options for the sort order of the feed
enum FeedType {
  SIMILAR  # Sort by a combination of freshness and score, using Reddit's algorithm
  RECENT  # Newest entries first
  TOP  # Highest score entries first
}

input Upload {
  name: String!
  type: String!
  size: Int!
  path: String!
}


type Query {

  search(query: String!): [Post]!

  feed(
    type: FeedType!, # The sort order for the feed
    offset: Int,    # The number of items to skip, for pagination
    limit: Int=10    # The number of items to fetch starting from the offset, for pagination
  ): [Post]

  questions(
    type: FeedType!, # The sort order for the questions
    offset: Int,    # The number of items to skip, for pagination
    limit: Int=10    # The number of items to fetch starting from the offset, for pagination
  ): [Question]

  # A single post
  post(postId: String!
  ): Post

   # A single question
  question(quesId: String!
  ): Question

  # All posts from user
  allPostsFromUser(
    postedById: String!
    offset: Int,    # The number of items to skip, for pagination
    limit: Int=10    # The number of items to fetch starting from the offset, for pagination
  ): [Post]

  # All answers from user
  allAnswersFromUser(
    postedById: String!
    offset: Int,    # The number of items to skip, for pagination
    limit: Int=10    # The number of items to fetch starting from the offset, for pagination
  ): [Answer]

  currentUser: User  # Return the currently logged in user, or null if nobody is logged in



}

# The type of vote to record, when submitting a vote
enum VoteType {
  UP
  DOWN
  CANCEL
}

type Mutation {
  # Submit a new post, returns the new submission
  submitPost(
    title: String!
    body: String!
    image: Upload
  ): Post

    # Submit a new post, returns the new submission
  submitQuestion(
    title: String!
  ): Question

  # Vote on a post submission, returns the submission that was voted on
  vote(
    postId: ID!,
    type: VoteType! # The type of vote - UP, DOWN, or CANCEL
  ): Post

  # Comment on a post, returns the new comment
  submitComment(
    postId: ID!, # The full post name from GitHub, e.g. "apollostack/GitHunt-API"
    content: String!
    # The text content for the new comment
    ): Comment


      # Answer a question, returns the new answer
  submitAnswer(
    quesId: ID!,
    content: String!
    # The text content for the new comment
    ): Answer


  addNewUser(
    firstName:String!, 
    lastName: String!, 
    username: String!, 
    email: String!, 
    age: Int!,  
    education: String
    occupation: String,
    gender: String!,
    joinedAt: Float!): User
}

type Subscription {
  # Subscription fires on every comment added
  commentAdded(post_id: ID!): Comment
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}`
];

export default rootSchema;
