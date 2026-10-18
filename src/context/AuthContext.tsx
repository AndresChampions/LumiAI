import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  Session,
  User,
} from "@supabase/supabase-js";

import {
  supabase,
} from "../lib/supabase";

export type Profile = {
  id: string;

  username: string;

  email: string | null;

  avatar_url: string | null;

  created_at?: string;

  updated_at?: string;
};

type BasicResult = {
  error:
    | string
    | null;
};

type SignUpResult = {
  error:
    | string
    | null;

  needsEmailConfirmation:
    boolean;
};

type AuthContextType = {
  session:
    | Session
    | null;

  user:
    | User
    | null;

  profile:
    | Profile
    | null;

  loading:
    boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<BasicResult>;

  signUp: (
    username: string,
    email: string,
    password: string
  ) => Promise<SignUpResult>;

  signOut:
    () => Promise<BasicResult>;

  refreshProfile:
    () => Promise<void>;

  updateProfile: (
    changes: Partial<
      Pick<
        Profile,
        | "username"
        | "avatar_url"
      >
    >
  ) => Promise<BasicResult>;
};

const AuthContext =
  createContext<
    AuthContextType |
      undefined
  >(undefined);

function translateAuthError(
  message: string
) {
  const lower =
    message.toLowerCase();

  if (
    lower.includes(
      "invalid login credentials"
    )
  ) {
    return "Correo o contraseña incorrectos.";
  }

  if (
    lower.includes(
      "email not confirmed"
    )
  ) {
    return "Debes confirmar tu correo antes de iniciar sesión.";
  }

  if (
    lower.includes(
      "user already registered"
    )
  ) {
    return "Ya existe una cuenta con ese correo.";
  }

  if (
    lower.includes(
      "email signups are disabled"
    )
  ) {
    return "El registro por correo está desactivado en Supabase.";
  }

  return message;
}

export function AuthProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const [
    session,
    setSession,
  ] =
    useState<
      Session |
        null
    >(null);

  const [
    user,
    setUser,
  ] =
    useState<
      User |
        null
    >(null);

  const [
    profile,
    setProfile,
  ] =
    useState<
      Profile |
        null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const loadProfile =
    async (
      userId:
        string
    ) => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            userId
          )
          .maybeSingle();

      if (error) {
        console.log(
          "PROFILE:",
          error.message
        );

        return;
      }

      if (data) {
        setProfile(
          data as Profile
        );
      }
    };

  const refreshProfile =
    async () => {
      if (
        !user?.id
      ) {
        return;
      }

      await loadProfile(
        user.id
      );
    };

  useEffect(() => {
    let mounted =
      true;

    const initialize =
      async () => {
        try {
          const {
            data,
            error,
          } =
            await supabase.auth.getSession();

          if (
            error
          ) {
            console.log(
              error.message
            );
          }

          if (
            !mounted
          ) {
            return;
          }

          setSession(
            data.session
          );

          setUser(
            data.session?.user ??
              null
          );

          if (
            data.session?.user
              ?.id
          ) {
            await loadProfile(
              data.session.user.id
            );
          }
        } finally {
          if (
            mounted
          ) {
            setLoading(
              false
            );
          }
        }
      };

    initialize();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          newSession
        ) => {
          setSession(
            newSession
          );

          setUser(
            newSession?.user ??
              null
          );

          if (
            newSession?.user
              ?.id
          ) {
            setTimeout(
              () => {
                loadProfile(
                  newSession
                    .user
                    .id
                );
              },
              0
            );
          } else {
            setProfile(
              null
            );
          }

          setLoading(
            false
          );
        }
      );

    return () => {
      mounted =
        false;

      subscription.unsubscribe();
    };
  }, []);

  const signIn =
    async (
      email:
        string,
      password:
        string
    ) => {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email
                .trim()
                .toLowerCase(),

            password,
          }
        );

      if (
        error
      ) {
        return {
          error:
            translateAuthError(
              error.message
            ),
        };
      }

      if (
        !data.session
      ) {
        return {
          error:
            "No se pudo crear la sesión.",
        };
      }

      return {
        error: null,
      };
    };

  const signUp =
    async (
      username:
        string,
      email:
        string,
      password:
        string
    ) => {
      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              email
                .trim()
                .toLowerCase(),

            password,

            options: {
              data: {
                username:
                  username.trim(),
              },
            },
          }
        );

      if (
        error
      ) {
        return {
          error:
            translateAuthError(
              error.message
            ),

          needsEmailConfirmation:
            false,
        };
      }

      return {
        error: null,

        needsEmailConfirmation:
          !data.session,
      };
    };

  const signOut =
    async () => {
      const {
        error,
      } =
        await supabase.auth.signOut();

      if (
        error
      ) {
        return {
          error:
            error.message,
        };
      }

      /*
       * Limpiamos el estado local
       * inmediatamente.
       */

      setSession(
        null
      );

      setUser(
        null
      );

      setProfile(
        null
      );

      return {
        error: null,
      };
    };

  const updateProfile =
    async (
      changes: Partial<
        Pick<
          Profile,
          | "username"
          | "avatar_url"
        >
      >
    ) => {
      if (
        !user?.id
      ) {
        return {
          error:
            "No hay sesión activa.",
        };
      }

      const {
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            ...changes,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            user.id
          );

      if (
        error
      ) {
        return {
          error:
            error.message,
        };
      }

      await loadProfile(
        user.id
      );

      return {
        error: null,
      };
    };

  return (
    <AuthContext.Provider
      value={{
        session,

        user,

        profile,

        loading,

        signIn,

        signUp,

        signOut,

        refreshProfile,

        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider"
    );
  }

  return context;
}