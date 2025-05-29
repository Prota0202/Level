import { getSession } from "@auth/solid-start";
import { redirect } from "@solidjs/router";
import { createMiddleware } from "@solidjs/start/middleware";
import { authOptions } from "~/routes/api/auth/[...solidauth]";

const authRoutes = [
  "/login",
  "/register",
];

// Daftar route yang hanya untuk user terautentikasi
const protectedRoutes = [
  "/",
  "/character/create",
  "/checking"
];

export default createMiddleware({
  onRequest: async (event) => {
    const url = new URL(event.request.url);
    const path = url.pathname;
    const session = await getSession(event.request, authOptions);

    if (authRoutes.includes(path) && session?.user) {
      return redirect(new URL("/", url).toString(), 301);
    }

    if (protectedRoutes.includes(path) && !session?.user) {
      return redirect(new URL("/login", url).toString(), 301);
    }
  },
});