import { relations } from "drizzle-orm"
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core"
import { type ProviderType } from "next-auth/providers"

export const users = sqliteTable("users", {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
    image: text("image"),
    hashedPassword: text("hashedPassword"),
})

export const accounts = sqliteTable(
    "accounts",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<ProviderType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compositePk: primaryKey(account.provider, account.providerAccountId),
    }),
)

export const userToAccounts = relations(users, ({ many }) => ({
    accounts: many(accounts),
}))

export const sessions = sqliteTable("sessions", {
    sessionToken: text("sessionToken").notNull().primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const sessionsToUser = relations(users,({many})=>({
    sessions: many(sessions)
}))

export const verificationTokens = sqliteTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
    },
    (vt) => ({
        compositePk: primaryKey(vt.identifier, vt.token),
    }),
)
