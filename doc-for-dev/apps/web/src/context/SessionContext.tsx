import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { UserDto } from "@forgeboard/shared";
import { api, errorMessage } from "../api/client";

const ACTOR_STORAGE_KEY = "forgeboard.demoActor";

interface SessionContextValue {
  users: UserDto[];
  currentUser: UserDto | null;
  isLoading: boolean;
  error: string | null;
  selectUser: (userId: string) => void;
  retry: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    api
      .listUsers(controller.signal)
      .then(({ users: fetchedUsers }) => {
        setUsers(fetchedUsers);
        setCurrentUserId((existingId) => {
          const storedId =
            existingId ??
            (typeof window === "undefined"
              ? null
              : window.localStorage.getItem(ACTOR_STORAGE_KEY));
          const preferred = fetchedUsers.find((user) => user.id === storedId);
          return preferred?.id ?? fetchedUsers[0]?.id ?? null;
        });
      })
      .catch((loadError: unknown) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setError(errorMessage(loadError));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  const selectUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
    window.localStorage.setItem(ACTOR_STORAGE_KEY, userId);
  }, []);

  const retry = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users]
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      users,
      currentUser,
      isLoading,
      error,
      selectUser,
      retry
    }),
    [currentUser, error, isLoading, retry, selectUser, users]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside SessionProvider.");
  }
  return value;
}
