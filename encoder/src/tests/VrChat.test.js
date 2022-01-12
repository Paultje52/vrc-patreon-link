const VrChat = require("../../build/vrchat/VrChat.js").default;
const { userRegex } = require("../../build/util/regex.js");
const fs = require("fs/promises");
const path = require("path");
let vrChat;

let targetUser = "https://vrchat.com/home/user/usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123";
let targetUserId = "usr_135ec558-0b44-4c9d-85b3-4cdcfbc08123";
let targetUserName = "Paultje52 8123";
let targetUserAvatar = "https://d348imysud55la.cloudfront.net/thumbnails/3770239543.thumbnail-500.png";

beforeAll(async () => {
  let file = await fs.readFile(path.join(__dirname, ".env"), "utf8");
  if (!file || file.split(".").length !== 3) throw new Error("Invalid .env: USERNAME.PASSWORD.AVATAR");

  vrChat = new VrChat({
    username: file.split(".")[0],
    password: file.split(".")[1],
    avatarId: file.split(".")[2]
  });
});

test("Get userId", () => {
  let id = targetUser.match(userRegex);
  if (id) id = id[0];
  expect(id).toBe(targetUserId);
});

test("User existance: true", async () => {
  expect(await vrChat.userExists(targetUserId)).toBe(true);
});

test("User query", async () => {
  expect(await vrChat.getUsernameFromId(targetUserId)).toBe(targetUserName);
  expect(await vrChat.getAvatarFromId(targetUserId)).toBe(targetUserAvatar);
});

test("VrChat upload", async () => {
  let file = path.join(__dirname, "upload-test-img.png");

  expect(await vrChat.upload(file)).toBe(true);
}, 15000);