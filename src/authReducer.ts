import { AuthState } from 'AuthProvider';
import { Auth0DecodedHash, Auth0UserProfile, Auth0Error } from 'auth0-js';


type AuthReducerError = {
  type: "error",
  errorType: string,
  error: Auth0Error,
  isAuthenticating?: boolean
}
type AuthReducerLogin= {
  type: "login",
  authResult: null | Auth0DecodedHash,
  user: null | Auth0UserProfile,
}
type AuthReducerLogout= {
  type: "logout",
}
type AuthReducerToggleAuthenticating= {
  type: "toggleAuthenticating",
}
export type AuthReducerAction = AuthReducerError | AuthReducerLogin | AuthReducerLogout | AuthReducerToggleAuthenticating;
export const authReducer = (state: AuthState, action: AuthReducerAction): AuthState => {
  switch (action.type) {
      case "login":
          const { authResult, user } = action;
          const expiresAt = (authResult && authResult.expiresIn ? authResult.expiresIn : 0) * 1000 + new Date().getTime();

          if (typeof localStorage !== "undefined") {
              localStorage.setItem("expires_at", JSON.stringify(expiresAt));
              localStorage.setItem("user", JSON.stringify(user));
          }

          return {
              ...state,
              user,
              expiresAt,
              authResult
          };
      case "logout":
          if (typeof localStorage !== "undefined") {
              localStorage.removeItem("expires_at");
              localStorage.removeItem("user");
          }

          return {
              ...state,
              user: null,
              expiresAt: null,
              authResult: null
          };
      case "toggleAuthenticating":
          return {
              ...state,
              isAuthenticating: !state.isAuthenticating
          };
      case "error":
          const { errorType, error } = action;
          return {
              ...state,
              user: null,
              expiresAt: null,
              authResult: null,
              errorType,
              error
          };
      default:
          return state;
  }
};
