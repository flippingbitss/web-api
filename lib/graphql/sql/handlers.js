import RedditScore from "reddit-score";
import knex from "./connector";

const POST_TABLE = "post";
const COMMENT_TABLE = "comment";
const USER_TABLE = "user";
const VOTE_TABLE = "vote";

// A utility function that makes sure we always query the same columns
function addSelectToPostQuery(query) {
  query
    .select("post.*", knex.raw("coalesce(sum(vote.vote_value), 0) as score"))
    .leftJoin(VOTE_TABLE, "post.id", "vote.postId")
    .groupBy("post.id");
}

// If we don't have a score, it is NULL by default
// Convert it to 0 on read.
function handleNullScoreInRow({ score, ...rest }) {
  return {
    score: score || 0,
    ...rest
  };
}

// Given a Knex query promise, resolve it and then format one or more rows
function formatRows(query) {
  return query.then(rows => {
    if (rows.map) {
      return rows.map(handleNullScoreInRow);
    }
    return handleNullScoreInRow(rows);
  });
}

export class Users {
  getUserById(id) {
    const query = knex(USER_TABLE).where({ id });
    return query.then(([row]) => row);
  }

  addNewUser(firstName, lastName, username, email, age) {
    return knex.transaction(trx =>
      trx(USER_TABLE)
        .insert({
          firstName,
          lastName,
          username,
          age,
          email,
          joinedAt: new Date(Date.now())
        })
        .returning("id")
        .then(([id]) => id)
        .catch(e => {
          throw new Error("Unable to add new user - " + e);
        })
    );
  }
}

export class Comments {
  getCommentById(id) {
    const query = knex(COMMENT_TABLE).where({ id });
    return query.then(([row]) => row);
  }

  getCommentsByPostId(postId, limit, offset) {
    const query = knex(COMMENT_TABLE)
      .where({ postId })
      .orderBy("createdAt", "asc");

    if (limit !== -1) {
      query.limit(limit).offset(offset);
    }

    return query.then(rows => rows || []);
  }

  getCommentCount(postId) {
    const query = knex(COMMENT_TABLE).where({ postId }).count();
    return query.then(rows =>
      rows.map(row => row["count(*)"] || row.count || "0")
    );
  }

  submitComment(postId, content, userid) {
    return knex
      .transaction(trx =>
        trx(COMMENT_TABLE)
          .insert({
            content,
            createdAt: new Date(Date.now()),
            postId: postId,
            postedBy: userid
          })
          .returning(["id", "content", "createdAt", "postId", "postedBy"])
      )
      .then(([result]) => result);
    // .return(
    //   (values)=>
    //   [values]
    //   )
    //.then(([id])=>this.getCommentById(id));
  }
}

const orderBy = {
  RECENT: ["createdAt", "desc"],
  TOP: ["score", "desc"],
  HOT: ["hotScore", "desc"],
  SIMILAR: ["hotScore", "desc"]
};

export class Posts {
  getForFeed(type, offset, limit) {
    const query = knex(POST_TABLE).modify(addSelectToPostQuery);

    if (orderBy[type]) {
      query.orderBy(...orderBy[type]);
    } else {
      throw new Error(`Feed type ${type} not implemented.`);
    }

    if (offset > 0) {
      query.offset(offset);
    }
    query.limit(limit);

    return formatRows(query);
  }

  getById(postId) {
    // No need to batch
    const query = knex(POST_TABLE)
      .where({
        id: postId
      })
      .first();

    console.log(postId, "post id");
    return formatRows(query);
  }

  getByTitle(title) {
    // No need to batch
    const query = knex(POST_TABLE)
      .modify(addSelectToPostQuery)
      .where({
        title
      })
      .first();
    console.log(title, "title");
    return formatRows(query);
  }

  getUpvotesById(postId) {
    return knex(VOTE_TABLE)
      .where({ postId })
      .andWhere("vote_value", ">", 0)
      .count()
      .then(rows => rows.map(row => row["count(*)"] || row.count || "0"));
  }

  submitVote(postId, voteValue, userid) {
    return (
      Promise.resolve()
        //   // First, get the entry_id from repoFullName
        //   .then(() => (
        //     knex(POST_TABLE)
        //       .where({
        //         repository_name: repoFullName,
        //       })
        //       .select(['id'])
        //       .first()
        //       .then(({ id }) => {
        //         entry_id = id;
        //       })
        //   ))
        // Remove any previous votes by this person
        .then(() =>
          knex(VOTE_TABLE)
            .where({
              postId,
              votedBy: userid
            })
            .delete()
        )
        // Then, insert a vote
        .then(() =>
          knex(VOTE_TABLE).insert({
            postId,
            votedBy: userid,
            vote_value: voteValue
          })
        )
        // Update hot score
        .then(() => this.updateHotScore(postId))
    );
  }

  updateHotScore(postId) {
    let _createdAt;

    return Promise.resolve()
      .then(() =>
        knex(POST_TABLE)
          .where({
            id: postId
          })
          // .select(["createdAt"])
          // .first()
          .returning('createdAt')
          .then(({ createdAt }) => {
            _createdAt = createdAt;
          })
      )
      .then(() => {
        return knex(VOTE_TABLE).select(["vote_value"]).where({
          postId
        });
      })
      .then(results => {
        function countVotes(vote) {
          return (count, value) => count + (value === vote ? 1 : 0);
        }
        if (results && results.map) {
          const votes = results.map(vote => vote.vote_value);
          const ups = votes.reduce(countVotes(1), 0);
          const downs = votes.reduce(countVotes(-1), 0);
          const date = _createdAt instanceof Date
            ? _createdAt
            : new Date(_createdAt);

          return new RedditScore().hot(ups, downs, date);
        }

        return 0;
      })
      .then(hotScore =>
        knex(POST_TABLE).where("id", postId).update({
          hotScore
        })
      );
  }

  haveVotedForPost(postId, userid) {
    return Promise.resolve()
      .then(() =>
        knex(VOTE_TABLE)
          .where({
            postId,
            votedBy: userid
          })
          .select(["vote_value"])
          .first()
      )
      .then(vote => vote || { vote_value: 0 });
  }

  submitPost(title, body, userid) {
    const rateLimitMs = 60 * 60 * 1000;
    const rateLimitThresh = 3;

    if (title.trim() === "")
      throw new Error("Cannot create post. Invalid Title");
    if (body.trim() === "") throw new Error("Cannot create post. Invalid Body");

    // Rate limiting logic
    return knex.transaction(trx =>
      trx(POST_TABLE)
        .count()
        .where("postedBy", "=", userid)
        .where("createdAt", ">", new Date(Date.now() - rateLimitMs))
        .then(obj => {
          // If the user has already submitted too many times, we don't
          // post the repo.
          const postCount = obj[0]["count(*)"];
          if (postCount > rateLimitThresh) {
            throw new Error("Too many posts submitted in the last hour!");
          } else {
            return trx(POST_TABLE)
              .insert({
                createdAt: new Date(Date.now()),
                // updated_at: new Date(Date.now()),
                title: title,
                body: body,
                postedBy: userid
              })
              .returning(["id"])
              .then(trx.commit)
              .then(([{ id }]) => 
              this.updateHotScore(id)
              );
          }
        })
    );
  }
}
