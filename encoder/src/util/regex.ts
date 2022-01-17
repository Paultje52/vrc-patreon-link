const userRegex = /(?:usr_)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gm;
const oldUserRegex = /(?:vrchat.com\/home\/user\/)[0-9a-zA-Z]{10}/gm;

export {
  userRegex,
  oldUserRegex
}