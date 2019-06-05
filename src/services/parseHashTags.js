function parseText(text) {
  const hashTags = text.match(/(#[a-z\d-|а-я\d-]+)/gi);

  if (hashTags) {
    return hashTags;
  }

  return [];
}

function parseHashTags(data) {
  if (typeof data === "string") {
    return parseText(data);
  }

  let hashTags = [];

  for (let text of data) {
    hashTags = hashTags.concat(parseText(text));
  }

  return hashTags;
}

module.exports = parseHashTags;
