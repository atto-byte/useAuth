<h1 align="center">useAuth – the simplest way to add authentication to your React app</h1>
<p> 
  <a href="https://github.com/atto-byte/useAuth/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
  </a>
</p>

> The simplest way to add authentication to your React app. Handles everything for you. Users, login forms, redirects, sharing state between components. Everything

## TSDX Implementation of https://github.com/Swizec/useAuth

## How to use useAuth

[`useAuth`](https://github.com/atto-byte/useAuth) is designed to be quick to setup. You'll need an Auth0 account with an app domain and client id.

### 1. Install the hook

```
$ yarn add use-auth0
```

Downloads from npm, adds to your package.json, etc. You can use `npm` as well.

### 2. Set up AuthProvider

useAuth uses an `AuthProvider` component to configure the Auth0 client and share state between components. It's using React context with a reducer behind the scenes, but that's an implementation detail.

I recommend adding this around your root component. In Gatsby that's done in `gatsby-browser.js` and `gatsby-ssr.js`. Yes `useAuth` is built so it doesn't break server-side rendering. ✌️

But of course server-side "you" will always be logged out.

```javascript
// gatsby-browser.js

import React from "react";
import { navigate } from "gatsby";

import { AuthProvider } from "use-auth0";

export const wrapRootElement = ({ element }) => (
    <AuthProvider
        navigate={navigate}
        auth0_domain="useauth.auth0.com"
        auth0_client_id="GjWNFNOHq1ino7lQNJBwEywa1aYtbIzh"
    >
        {element}
    </AuthProvider>
);
```

`<AuthProvider>` creates a context, sets up a state reducer, initializes an Auth0 client and so on. Everything you need for authentication to work in your whole app :)

The API takes a couple config options:

1. `navigate` – your navigation function, used for redirects. I've tested with Gatsby, but anything should work
2. `auth0_domain` – from your Auth0 app
3. `auth0_client_id` – from your Auth0 app
4. `auth0_params` – an object that lets you overwrite any of the default Auth0 client parameters

_PS: even though Auth doesn't do anything server-side, useAuth will throw errors during build, if its context doesn't exist_

#### Default Auth0 params

By default `useAuth`'s Auth0 client uses these params:

```javascript
const params = {
    domain: auth0_domain,
    clientID: auth0_client_id,
    redirectUri: `${callback_domain}/auth0_callback`,
    audience: `https://${auth0_domain}/api/v2/`,
    responseType: "token id_token",
    scope: "openid profile email"
};
```

`domain` and `clientID` come from your props.

`redirectUri` is set to use the `auth0_callback` page on the current domain. Auth0 redirects here after users login so you can set cookies and stuff. `useAuth` will handle this for you ✌️

`audience` is set to use api/v2. I know this is necessary but honestly have been copypasting it through several of my projects.

`responseType` same here. I copy paste this from old projects so I figured it's a good default.

`scope` you need `openid` for social logins and to be able to fetch user profiles after authentication. Profile and Email too. You can add more via the `auth0_params` override.

### 3. Create the callback page

Auth0 and most other authentication providers use OAuth. That requires redirecting your user to _their_ login form. After login, the provider redirects the user back to _your_ app.

Any way of creating React pages should work, here's what I use for Gatsby.

```javascript
// src/pages/auth0_callback

import React, { useEffect } from "react";

import { useAuth } from "use-auth0";
import Layout from "../components/layout";

const Auth0CallbackPage = () => {
    const { handleAuthentication } = useAuth();
    useEffect(() => {
        handleAuthentication();
    }, []);

    return (
        <Layout>
            <h1>
                This is the auth callback page, you should be redirected
                immediately.
            </h1>
        </Layout>
    );
};

export default Auth0CallbackPage;
```

The goal is to load a page, briefly show some text, and run the `handleAuthentication` method from `useAuth` on page load.

That method will create a cookie in local storage with your user's information and redirect back to the homepage by default.

To redirect to a route other than the homepage after the user is logged in, supply the `handleAuthentication` function an Object Literal with the `postLoginRoute` key and an associated route value. For example, to route to `/account`, call `handleAuthentication` as follows:

```javascript
handleAuthentication({ postLoginRoute: "/account" });
```

**_PS: Make sure you add `<domain>/auth0_callback` as a valid callback URL in your Auth0 config_**

### 4. Enjoy useAuth

[![](https://i.imgur.com/KunEemN.gif)](https://gatsby-useauth-example.now.sh)

You're ready to use `useAuth` for authentication in your React app.

Here's a login button for example:

```javascript
// src/pages/index.js

const Login = () => {
    const { isAuthenticated, login, logout } = useAuth();

    if (isAuthenticated()) {
        return <Button onClick={logout}>Logout</Button>;
    } else {
        return <Button onClick={login}>Login</Button>;
    }
};
```

`isAuthenticated` is a method that checks if the user's cookie is still valid. `login` and `logout` trigger their respective actions.

You can even say hello to your users

```javascript
// src/pages/index.js

const IndexPage = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <Layout>
      <SEO title="Home" />
      <h1>Hi {isAuthenticated() ? user.name : "people"}</h1>
```

Check `isAuthenticated` then use the user object. Simple as that.

`isAuthenticating` is a flag for checking whether or not `useAuth` is in the middle of validating login details. This allows you to then make requests to your user database and work out where to send users from the `auth0_callback` page, e.g. profile page or sign up.

```javascript
const Auth0CallbackPage = () => {
    const { user, isAuthenticating, handleAuthentication } = useAuth();
    const { loading, data, error } = useQuery(QUERY, {
        variables: { id: user.sub }
    });

    if (error) {
        return <h1>There was an error</h1>;
    }

    if (isAuthenticating || loading) {
        return (
            <h1>
                This is the auth callback page, you should be redirected
                immediately.
            </h1>
        );
    }

    const { user: dbUser } = data || {};
    const redirectUrl = dbUser ? "/app/profile" : "/app/signup";

    handleAuthentication({ postLoginRoute: redirectUrl });
};
```

## Checklist for configuring Auth0

There's a couple of required configurations you need to make in Auth0 to make useAuth run smoothly.

**Callback URLs**

You need to allow both local development and your production app in callback URLs. It's a whitelist that tells Auth0 that your login request is coming from the right source.

![](https://i.imgur.com/xz8UK8Z.png)

**Allowed Web Origins**

useAuth avoids using local storage for secure tokens. For Auth0 to know that our `checkSession` request is coming from the right source, you need to add your URLs to allowed web origins.

![](https://i.imgur.com/w2mmHH1.png)

**Allowed logout urls**

After logging out, Auth0 redirects back to your app. Again, it needs to know you aren't up to anything shady.

![](https://i.imgur.com/S160EiI.png)

# Tips & tricks

## Persisting login after refresh

**NB Make sure you're not blocking cookies! Extensions like privacy badger will prevent Auth0 from setting cookies so refreshing between logins wont work**

After you've set everything up (and you're using social sign on methods) you'll notice that refreshing doesn't keep your user logged in... 👎

If you're using an IdP such as Google or Github to provide identity, you will need to register an app on Auth0 to enable this behaviour. The steps to create this behaviour are a bit nested in docs but can be achieved relatively simply by following the guide [`Set Up Social Connections`](https://auth0.com/docs/dashboard/guides/connections/set-up-connections-social) on the Auth0 site. The guide follows steps for Google sign on, your mileage with other providers may vary...

For a more detailed understanding of why this is happening you can have a read through [this section](https://auth0.com/blog/react-tutorial-building-and-securing-your-first-app/#Securing-your-React-App) of Auth0s guide to setting up a secure React application. (Pro tip: search for `Keeping Users Signed In after a Refresh` to jump straight to the section in question).

## User's access tokens

Since version 0.4.0 useAuth exposes the entire Auth0 authResult object so you can access your user's id or access token. This is useful when you have to log the user into your own backend as well as the frontend.

Like this:

```javascript
function SomeComponent() {
    const { authResult } = useAuth();

    console.log(authResult.idToken);
    console.log(authResult.accessToken);
    // etc, I recommend printing the authResult object to see everything that's available
}
```



## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/atto-byte/useAuth/issues).

I am looking to support other authentication providers. Please help :)

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [atto-byte Teller <atto-byte@atto-byte.com>](https://github.com/atto-byte).<br />
This project is [MIT](https://github.com/atto-byte/useAuth/blob/master/LICENSE) licensed.



This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
