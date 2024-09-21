export function getPublicIdFromUrl(url) {
  // Use a regular expression to match the public ID
  const regex = /\/([^\/]+)\.[a-zA-Z]+$/;
  const match = url.match(regex);

  // If there's a match, return the public ID
  if (match && match[1]) {
    return match[1];
  }

  // Return null if the public ID couldn't be extracted
  return null;
}