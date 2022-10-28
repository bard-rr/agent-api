export const escapeString = (str) => {
  if (typeof str !== "string") {
    return str;
  }
  return str.replace(/['\\]/g, function (char) {
    switch (char) {
      case "'":
      case "\\":
        return "\\" + char; // prepends a backslash to backslash, percent,
      // and double/single quotes
    }
  });
};
