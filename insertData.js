let fs = require("fs");
let graphql = require("graphql-client");

let file = fs.readFileSync(
  "../../../../Downloads/Scrape - Sheet1.tsv",
  "utf-8"
);
let lines = file.split("\n").map((item, idx) => item.split("\t"));

const query = `
mutation submitPost ($title: String!, $body: String!) {
  submitPost(title: $title, body: $body) {
    id
  }
}`;

const client = graphql({
  url: "http://192.168.1.12:8016/graphql",
  headers: {
    ["Content-Type"]: "application/json",
    Accept: "application/json"
  }
});

lines.forEach((item, idx) => {
  let variables = {
    title: item[0],
    body: item[1]
  };

  client
    .query(query, variables)
    .then(function(body) {
      console.log(body);
    })
    .catch(function(err) {
      console.log(err.message);
    });
});
