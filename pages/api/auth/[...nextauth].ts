import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import GithubProvider from "next-auth/providers/github"
import TwitterProvider from "next-auth/providers/twitter"
import Auth0Provider from "next-auth/providers/auth0"
import AzureADProvider from "next-auth/providers/azure-ad"
// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"

const OIDC_ID_SCOPE = "openid"
const OIDC_EMAIL_SCOPE = "email"
const OIDC_PROFILE_SCOPE = "profile"
const OIDC_REFRESH_SCOPE = "offline_access"
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent
const MS_GRAPH_USER_READ_SCOPE = "User.Read" // equivalent to https://graph.microsoft.com/User.Read

const MS_GRAPH_USER_PROFILE_EP = "https://graph.microsoft.com/v1.0/me"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default NextAuth({
  // https://next-auth.js.org/configuration/providers/oauth
  providers: [
    /* EmailProvider({
         server: process.env.EMAIL_SERVER,
         from: process.env.EMAIL_FROM,
       }),
    // Temporarily removing the Apple provider from the demo site as the
    // callback URL for it needs updating due to Vercel changing domains
      
    Providers.Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: {
        appleId: process.env.APPLE_ID,
        teamId: process.env.APPLE_TEAM_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
        keyId: process.env.APPLE_KEY_ID,
      },
    }),
    */
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET,
    }),
    Auth0Provider({
      clientId: process.env.AUTH0_ID,
      clientSecret: process.env.AUTH0_SECRET,
      issuer: process.env.AUTH0_ISSUER,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: `${OIDC_ID_SCOPE} \
                  ${OIDC_PROFILE_SCOPE} \
                  ${OIDC_REFRESH_SCOPE} \
                  ${MS_GRAPH_USER_READ_SCOPE}`
        }
      },
      async profile(idTokenPayload, tokens) {
        // 'tokens' is the data return from the token_endpoint using the authorization code request
        // console.log("access_token:", tokens.access_token)
        // console.log("refresh_token:", tokens.refresh_token)
        // console.log("id_token:", tokens.id_token)
        // console.log("idTokenPayload", idTokenPayload)
        let user = {
          // This object is exact same as the argument 'user' of following callbacks signin() and jwt()
          id: idTokenPayload.sub,
          name: idTokenPayload.name,
        }
        // Get additional information via Microsoft Graph API
        // https://docs.microsoft.com/en-us/graph/api/resources/user?view=graph-rest-1.0#properties
        let msGraphUserProps = "displayName,givenName,surname,department,jobTitle"
        const msGraphUserPropsSelectParam = "$select"
        let requestUrl = MS_GRAPH_USER_PROFILE_EP
        if (msGraphUserProps) {
          requestUrl = `${requestUrl}?${msGraphUserPropsSelectParam}=${msGraphUserProps}`
        }
        const response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        })
        if (response.ok) {
          const result = (await response.json())
          // console.log("result", result)
          for (let key in result) {
            if (key != "@odata.context") {
              user[key] = result[key]
            }
          }
        }
        return user
      },
    }),
  ],
  theme: {
    colorScheme: "light",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // console.log("signIn")
      return true
    },
    async redirect({ url, baseUrl }) {
      // console.log("redirect")
      return baseUrl
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      // console.log("jwt")
      for (let key in user) {
        token[key] = user[key]
      }
      return token
    },
    async session({ session, user, token }) {
      // console.log("session")
      session.user.givenName = token.givenName
      session.user.surname = token.surname
      session.user.department = token.department
      session.user.jobTitle = token.jobTitle
      return session
    }
  },
})
