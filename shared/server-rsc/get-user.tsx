import { eq } from "drizzle-orm"
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { db } from "~/db/drizzle-db"
import { sessions, users } from "~/db/schema"

export interface User {
    id: string
    email: string
    name: string | undefined
}

export type GetUser = () => Promise<User | null>

export function createGetUser(
    cookies: RequestCookies | ReadonlyRequestCookies,
) {
    return async () => {
        const newCookies = cookies.getAll().reduce((cookiesObj, cookie) => {
            cookiesObj[cookie.name] = cookie.value
            return cookiesObj
        }, {} as Record<string, string>)

        const sessionToken =
            newCookies["next-auth.session-token"] ??
            newCookies["__Secure-next-auth.session-token"]
        if (!sessionToken) return null

        const session = await db
            .select({
                user_id: users.id,
                user_name: users.name,
                user_email: users.email,
            })
            .from(sessions)
            .innerJoin(users, eq(users.id, sessions.userId))
            .where(eq(sessions.sessionToken, sessionToken))
            .limit(1).get()

        if (!session) return null

        const user: User = {
            id: session.user_id,
            name: session.user_name ?? undefined,
            email: session.user_email,
        }
        return user
    }
}
