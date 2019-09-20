import React, { createContext, useReducer, useEffect, useState } from "react";
import Auth0, { Auth0UserProfile, Auth0DecodedHash, Auth0Error, WebAuth } from "auth0-js";

import { authReducer, AuthReducerAction } from "./authReducer";
import { handleAuthResult } from "./useAuth";

export interface AuthState {
  user: null | Auth0UserProfile,
  expiresAt: null | number,
  isAuthenticating: boolean,
  authResult: Auth0DecodedHash | null,
  errorType: string | null,
  error: Auth0Error | null
}
export interface AuthContextState {
  state: AuthState;
  dispatch: React.Dispatch<AuthReducerAction>;
  auth0: WebAuth;
  callback_domain: string;
  navigate: any;
}
interface AuthProviderProps {
  navigate: (route: string) => void;
  auth0_domain: string;
  auth0_client_id: string;
  auth0_params?: any;
}
export const AuthContext = createContext<AuthContextState>({} as AuthContextState);

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    navigate,
    auth0_domain,
    auth0_client_id,
    auth0_params
}) => {
    const callback_domain =
        typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.host}`
            : "http://localhost:8000";

    const params = {
        domain: auth0_domain,
        clientID: auth0_client_id,
        redirectUri: `${callback_domain}/auth0_callback`,
        audience: `https://${auth0_domain}/api/v2/`,
        responseType: "token id_token",
        scope: "openid profile email"
    };

    // Instantiate Auth0 client
    const auth0 = new Auth0.WebAuth({ ...params, ...auth0_params });

    // Holds authentication state
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        expiresAt: null,
        isAuthenticating: false,
        authResult:null,
        errorType: null,
        error: null
    });

    const [contextValue, setContextValue] = useState({
        state,
        dispatch,
        auth0,
        callback_domain,
        navigate
    });

    // Update context value and trigger re-render
    // This patterns avoids unnecessary deep renders
    // https://reactjs.org/docs/context.html#caveats
    useEffect(() => {
        setContextValue({ ...contextValue, state });
    }, [state]);

    // Verify user is logged-in on AuthProvider mount
    // Avoids storing sensitive data in local storage
    useEffect(() => {
        dispatch({
            type: "toggleAuthenticating"
        });
        auth0.checkSession({}, (err, authResult: Auth0DecodedHash) => {
            if (err) {
                dispatch({
                    type: "error",
                    errorType: "checkSession",
                    error: err
                });
            } else {
                handleAuthResult({ dispatch, auth0, authResult });
            }
        });
    }, []);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};


