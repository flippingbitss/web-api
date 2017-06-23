exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable("user", function(table) {
      table.increments("id").primary();
      table.string("username");
      table.string("password");
      table.string("firstname");
      table.string("lastname");
      table.string("email");
      table.timestamp("joinedAt").defaultTo(knex.fn.now());
    }),

    knex.schema.createTable("posts", function(table) {
      table.increments("id").primary();
      table.string("title");
      table.string("body");
      table.integer("postedBy").references("id").inTable("user");
      table.timestamp("createdAt").defaultTo(knex.fn.now());
    }),

    knex.schema.createTable("comments", function(table) {
      table.increments("id").primary();
      table.string("content");
      table.integer("postedBy").references("id").inTable("user");
      table.integer("postId").references("id").inTable("posts");
      table.dateTime("createdAt");
    }),

    knex.schema.createTable("vote", function(table) {
      table.increments("id").primary();
      table.string("vote_value");    
      table.integer("postId").references("id").inTable("post");
 
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable("user"),
    knex.schema.dropTable("post"),
    knex.schema.dropTable("comment"),
    knex.schema.dropTable("vote")
  ]);
};
