"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Keep in sync with the same literal read in src/lib/queries/reference.ts — a "use server"
// file can only export async functions, so this can't be a shared exported constant.
const ACTING_USER_COOKIE = "acting_user_id";

export async function setActingUser(userId: string) {
  cookies().set(ACTING_USER_COOKIE, userId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
