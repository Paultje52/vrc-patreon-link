export default function parseSetCookie(setCookieHeader: string, cookieName: string) {
  const cookies = setCookieHeader.split(";").map(cookie => cookie.trim());
  const cookie = cookies.find(cookie => cookie.startsWith(cookieName));

  if (!cookie) return null;
  return cookie.split("=")[1];
}