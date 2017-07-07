import Knex from "knex";
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable("user", function(table) {
      table.increments("id").primary();
      table.string("username").unique().notNullable();
      // table.string("password");
      table.string("firstName").notNullable();
      table.string("lastName").notNullable();
      table.string("email").notNullable();
      table.string("gender", 1).notNullable();
      table.string("occupation");
      table.string("education");
      table.integer("age").notNullable();
      table.timestamp("joinedAt").defaultTo(knex.fn.now());
    }),

    knex.schema.createTable("post", function(table) {
      table.increments("id").primary();
      table.text("title").notNullable();
      table.text("body").notNullable();
      table.integer("score").notNullable().defaultTo(0);
      table.float("hotScore").notNullable().defaultTo(0);
      table.integer("postedBy").references("id").inTable("user");
      table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    }),

    knex.schema.createTable("question", function(table) {
      table.increments("id").primary();
      table.text("title").notNullable();
      table.integer("postedBy").references("id").inTable("user");
      table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    }),

    knex.schema.createTable("comment", function(table) {
      table.increments("id").primary();
      table.text("content").notNullable();
      table.integer("postedBy").references("id").inTable("user");
      table.integer("postId").references("id").inTable("post");
      table.dateTime("createdAt");
    }),
    knex.schema.createTable("answer", function(table) {
      table.increments("id").primary();
      table.text("content").notNullable();
      table.integer("postedBy").references("id").inTable("user");
      table.integer("quesId").references("id").inTable("question");
      table.dateTime("createdAt");
    }),

    knex.schema.createTable("vote", function(table) {
      table.increments("id").primary();
      table.integer("vote_value").notNullable();
      table.integer("votedBy").references("id").inTable("user");
      table.integer("postId").unique().references("id").inTable("post");
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable("vote"),
    knex.schema.dropTable("comment"),
    knex.schema.dropTable("user"),
    knex.schema.dropTable("post"),
    knex.schema.dropTable("answer"),
    knex.schema.dropTable("question")
  ]);
};
