import { useSession } from "../context/SessionContext";
import { InitialsAvatar } from "./InitialsAvatar";

export function IdentitySwitcher() {
  const { users, currentUser, selectUser } = useSession();
  if (!currentUser) {
    return null;
  }

  return (
    <div className="identity">
      <span className="identity__eyebrow">Acting as</span>
      <div className="identity__control">
        <InitialsAvatar user={currentUser} size="sm" />
        <label className="identity__label" htmlFor="demo-identity">
          Demo identity
        </label>
        <select
          id="demo-identity"
          className="identity__select"
          value={currentUser.id}
          onChange={(event) => selectUser(event.target.value)}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} · {user.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
