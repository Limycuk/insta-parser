var axios = require("axios");
var config = require("config");

function getFollowerUsernames(username, endCursor) {
  const variables = {
    id: config.get(`userIds.${username.replace(/\./g, "_")}`),
    include_reel: false,
    fetch_mutual: false,
    first: 50
  };

  if (endCursor) {
    variables.after = endCursor;
  }

  return new Promise(resolve => {
    axios({
      method: "GET",
      url: "https://www.instagram.com/graphql/query",
      params: {
        query_hash: config.get("query_hash.followers"),
        variables: JSON.stringify(variables)
      },
      headers: {
        cookie: config.get("cookie")
      }
    }).then(response => {
      const { edges, page_info } = response.data.data.user.edge_followed_by;
      const usernames = edges.map(follower => follower.node.username);

      resolve({
        usernames,
        page_info
      });
    });
  });
}

module.exports = getFollowerUsernames;
