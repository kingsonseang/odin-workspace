import type { ActivityDto } from "@forgeboard/shared";
import { formatDateTime } from "../utils/format";
import { describeActivity } from "../utils/activity";
import { InitialsAvatar } from "./InitialsAvatar";

export function ActivityFeed({ activity }: { activity: ActivityDto[] }) {
  return (
    <section className="panel activity-panel" aria-labelledby="activity-title">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Project log</p>
          <h2 id="activity-title">Activity</h2>
        </div>
        <span className="count-badge">{activity.length}</span>
      </div>

      {activity.length === 0 ? (
        <p className="muted">No activity has been recorded yet.</p>
      ) : (
        <ol className="activity-list">
          {activity.map((entry) => (
            <li className="activity-item" key={entry.id}>
              <InitialsAvatar user={entry.actor} size="sm" />
              <div className="activity-item__body">
                <p>
                  <strong>{entry.actor.name}</strong>{" "}
                  {describeActivity(entry)}
                </p>
                <time dateTime={entry.createdAt}>
                  {formatDateTime(entry.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
