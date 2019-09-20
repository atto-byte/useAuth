import { useContext } from "react";
import { Auth0DecodedHash, Auth0ParseHashError, Auth0Error, WebAuth } from "auth0-js";

import { AuthContext } from "./AuthProvider";
import { AuthReducerAction } from 'authReducer';
interface SetSession {
  dispatch: React.Dispatch<AuthReducerAction>;
  auth0: WebAuth;
  authResult: Auth0DecodedHash;
}

async function setSession({ dispatch, auth0, authResult }: SetSession) {
    return new Promise((resolve, reject) => {
        auth0.client.userInfo(authResult.accessToken as string, (err, user) => {
            if (err) {
                dispatch({
                    type: "error",
                    errorType: "userInfo",
                    error: err
                });
                reject(err);
            } else {
                dispatch({
                    type: "login",
                    authResult,
                    user
                });
                resolve(user);
            }
        });
    });
}
interface HandleAuthResult {
  err?: Auth0Error | Auth0ParseHashError | null;
  dispatch: React.Dispatch<AuthReducerAction>;
  auth0: WebAuth;
  authResult: Auth0DecodedHash | null;
}
export const handleAuthResult = async ({
    err,
    dispatch,
    auth0,
    authResult
}: HandleAuthResult) => {
    if (authResult && authResult.accessToken && authResult.idToken) {
        await setSession({ dispatch, auth0, authResult });

        dispatch({
            type: "toggleAuthenticating"
        });

        return true;
    } else if (err) {
        console.error(err);
        dispatch({
            type: "error",
            error: err,
            errorType: "authResult",
            isAuthenticating: false
        });

      }
    return false;
};

export const useAuth = () => {
    const { state, dispatch, auth0, callback_domain, navigate } = useContext(AuthContext);

    const login = () => {
        auth0.authorize();
    };

    const logout = () => {
        auth0.logout({
            returnTo: callback_domain
        });
        dispatch({
            type: "logout"
        });

        // Return to the homepage after logout.
        navigate("/");
    };

    const handleAuthentication = ({ postLoginRoute = "/" } = {}) => {
        if (typeof window !== "undefined") {
            dispatch({
                type: "toggleAuthenticating"
            });

            auth0.parseHash(async (err, authResult) => {
                await handleAuthResult({ err, authResult, dispatch, auth0 });

                navigate(postLoginRoute);
            });
        }
    };

    const isAuthenticated = () => {
        return state.expiresAt && new Date().getTime() < state.expiresAt;
    };

    return {
        isAuthenticating: state.isAuthenticating,
        isAuthenticated,
        user: state.user,
        userId: state.user ? state.user.sub : null,
        authResult: state.authResult,
        login,
        logout,
        handleAuthentication
    };
};
