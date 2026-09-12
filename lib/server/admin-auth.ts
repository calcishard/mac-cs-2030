export const ADMIN_COOKIE = "mac_cs_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

const adminPassword = () => process.env.ADMIN_PASSWORD;

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

export const adminConfigured = () => Boolean(adminPassword());

// The cookie holds a hash of the password, so changing the password signs everyone out.
async function sessionToken() {
  const password = adminPassword();
  return password ? digest(`mac-cs-2030 admin session:${password}`) : null;
}

export async function checkPassword(input: string) {
  const password = adminPassword();
  if (!password) return false;
  return sameText(await digest(input), await digest(password));
}

export async function isAdminSession(token: string | null | undefined) {
  const expected = await sessionToken();
  return Boolean(expected && token && sameText(token, expected));
}

export async function isAdminRequest(request: Request) {
  const cookies = (request.headers.get("cookie") ?? "").split(";").map(part => part.trim());
  const cookie = cookies.find(part => part.startsWith(`${ADMIN_COOKIE}=`));
  return isAdminSession(cookie?.slice(ADMIN_COOKIE.length + 1));
}

export async function sessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${await sessionToken()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export const clearedSessionCookie = () => `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
