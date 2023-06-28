import type {
    BuiltInProviderType,
    RedirectableProviderType,
} from "@auth/core/providers"
import type {
    LiteralUnion,
    SignInAuthorizationParams,
    SignInOptions,
    SignOutParams,
} from "next-auth/react"

/**
 * Client-side method to initiate a signin flow
 * or send the user to the signin page listing all possible providers.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signin)
 */
export async function signIn<
    P extends RedirectableProviderType | undefined = undefined,
>(
    providerId?: LiteralUnion<
        P extends RedirectableProviderType
            ? P | BuiltInProviderType
            : BuiltInProviderType
    >,
    options?: SignInOptions,
    authorizationParams?: SignInAuthorizationParams,
) {
    const { callbackUrl = window.location.href, redirect = true } =
        options ?? {}

    // TODO: Support custom providers
    const isCredentials = providerId === "credentials"
    const isEmail = providerId === "email"
    const isSupportingReturn = isCredentials || isEmail

    // TODO: Handle custom base path
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const signInUrl = `/api/auth/${
        isCredentials ? "callback" : "signin"
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    }/${providerId}`

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const _signInUrl = `${signInUrl}?${new URLSearchParams(
        authorizationParams,
    )}`

    // TODO: Handle custom base path
    const csrfTokenResponse = await fetch("/api/auth/csrf")
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { csrfToken } = await csrfTokenResponse.json()
    const res = await fetch(_signInUrl, {
        method: "post",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Auth-Return-Redirect": "1",
        },
        // @ts-expect-error -- ignore
        body: new URLSearchParams({
            ...options,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            csrfToken,
            callbackUrl,
        }),
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await res.clone().json()
    if (redirect || !isSupportingReturn) {
        // TODO: Do not redirect for Credentials and Email providers by default in next major
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        window.location.href = data.url ?? data.redirect ?? callbackUrl
        // If url contains a hash, the browser does not reload the page. We reload manually
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        if (data.url.includes("#")) window.location.reload()
        return
    }
    return res
}

/**
 * Signs the user out, by removing the session cookie.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signout)
 */
export async function signOut(options?: SignOutParams) {
    const { callbackUrl = window.location.href } = options ?? {}
    // TODO: Custom base path
    const csrfTokenResponse = await fetch("/api/auth/csrf")
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { csrfToken } = await csrfTokenResponse.json()
    const res = await fetch(`/api/auth/signout`, {
        method: "post",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            csrfToken,
            callbackUrl,
        }),
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const url = data.url ?? data.redirect ?? callbackUrl
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    window.location.href = url
    // If url contains a hash, the browser does not reload the page. We reload manually
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (url.includes("#")) window.location.reload()
}
