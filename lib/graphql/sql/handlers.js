import RedditScore from 'reddit-score';
import knex from './connector';

const POST_TABLE = 'post'
const COMMENT_TABLE = 'comment'
const USER_TABLE = 'user'
const VOTE_TABLE = 'vote'


// A utility function that makes sure we always query the same columns
function addSelectToEntryQuery(query) {
  query.select('entries.*', knex.raw('coalesce(sum(votes.vote_value), 0) as score'))
    .leftJoin(VOTE_TABLE, 'entries.id', 'votes.entry_id')
    .groupBy('entries.id');
}

// If we don't have a score, it is NULL by default
// Convert it to 0 on read.
function handleNullScoreInRow({ score, ...rest }) {
  return {
    score: score || 0,
    ...rest,
  };
}

// Given a Knex query promise, resolve it and then format one or more rows
function formatRows(query) {
  return query.then((rows) => {
    if (rows.map) {
      return rows.map(handleNullScoreInRow);
    }
    return handleNullScoreInRow(rows);
  });
}

export class Users {
  getUserById(id) {
    const query = knex(USER_TABLE)
      .where({ id });
    return query.then(([row]) => row);
  }

  addNewUser(firstName,lastName,username, age, email) {
    return knex.transaction(trx => trx(USER_TABLE)
      .insert({
        firstName,
        lastName,
        username,
        age,
        joinedAt: new Date(Date.now()),
      })
      .returning('id'));
  }
}




export class Comments {
  getCommentById(id) {
    const query = knex(COMMENT_TABLE)
      .where({ id });
    return query.then(([row]) => row);
  }

  getCommentsByPostId(postId, limit, offset) {
    const query = knex(COMMENT_TABLE)
      .where({ postId })
      .orderBy('created_at', 'desc');

    if (limit !== -1) {
      query.limit(limit).offset(offset);
    }

    return query.then(rows => (rows || []));
  }

  getCommentCount(postId) {
    const query = knex(COMMENT_TABLE)
      .where({ postId })
      .count();
    return query.then(rows => rows.map(row => (row['count(*)'] || row.count || '0')));
  }

  submitComment(postId, username, content) {
    return knex.transaction(trx => trx(COMMENT_TABLE)
      .insert({
        content,
        created_at: new Date(Date.now()),
        postId: postId,
        posted_by: username,
      })
      .returning('id'));
  }
}

const orderBy = {
    NEW: ['created_at','desc'],
    TOP: ['score','desc'],
    HOT: ['hot_score','desc'],
}

export class Posts {
  getForFeed(type, offset, limit) {
    const query = knex(POST_TABLE)
      .modify(addSelectToEntryQuery);

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

  // getByRepoFullName(name) {
  //   // No need to batch
  //   const query = knex(POST_TABLE)
  //     .modify(addSelectToEntryQuery)
  //     .where({
  //       repository_name: name,
  //     })
  //     .first();

  //   return formatRows(query);
  // }

  upvoteForPost(postId, voteValue, username) {
    return Promise.resolve()

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
      .then(() => (
        knex(VOTE_TABLE)
          .where({
            postId,
            username,
          })
          .delete()
      ))
      // Then, insert a vote
      .then(() => (
        knex(VOTE_TABLE)
          .insert({
            entry_id,
            username,
            vote_value: voteValue,
          })
      ))
      // Update hot score
      .then(() => this.updateHotScore(postId));
  }

  updateHotScore(postId) {
    let createdAt;

    return Promise.resolve()
      .then(() => (
        knex(POST_TABLE)
          .where({
            postId,
          })
          .select(['created_at'])
          .first()
          .then(({ created_at }) => {
            createdAt = created_at;
          })
      ))
      .then(() => {
        return knex(VOTE_TABLE)
          .select(['vote_value'])
          .where({
            postId,
          });
      })
      .then((results) => {
        function countVotes(vote) {
          return (count, value) => count + (value === vote ? 1 : 0);
        }
        if (results && results.map) {
          const votes = results.map(vote => vote.vote_value);
          const ups = votes.reduce(countVotes(1),0);
          const downs = votes.reduce(countVotes(-1), 0);
          const date = createdAt instanceof Date ? createdAt : new Date(createdAt);

          return (new RedditScore()).hot(ups, downs, date);
        }

        return 0;
      })
      .then(hotScore => (
        knex(POST_TABLE)
          .where('id', postId)
          .update({
            hot_score: hotScore,
          })
      ));
  }

  haveVotedForPost(postId, username) {

    return Promise.resolve()

    // First, get the entry_id from repoFullName
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

      .then(() => (
        knex(VOTE_TABLE)
          .where({
            postId,
            username,
          })
          .select(['vote_value'])
          .first()
      ))

      .then(vote => vote || { vote_value: 0 });
  }

  submitRepository(repoFullName, username) {
    const rateLimitMs = 60 * 60 * 1000;
    const rateLimitThresh = 3;

    // Rate limiting logic
    return knex.transaction(trx => trx(POST_TABLE)
      .count()
      .where('posted_by', '=', username)
      .where('created_at', '>', new Date(Date.now() - rateLimitMs))
      .then((obj) => {
        // If the user has already submitted too many times, we don't
        // post the repo.
        const postCount = obj[0]['count(*)'];
        if (postCount > rateLimitThresh) {
          throw new Error('Too many repos submitted in the last hour!');
        } else {
          return trx(POST_TABLE)
            .insert({
              created_at: new Date(Date.now()),
              updated_at: new Date(Date.now()),
              repository_name: repoFullName,
              posted_by: username,
            });
        }
      }))
      .then(() => this.updateHotScore(repoFullName));
  }
}