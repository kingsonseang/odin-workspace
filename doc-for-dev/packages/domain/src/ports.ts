import type { Activity, Project, Task, User } from "./entities";

export interface ProjectRepository {
  list(): Project[];
  findById(id: string): Project | null;
  save(project: Project): void;
}

export interface TaskRepository {
  listByProject(projectId: string): Task[];
  findById(id: string): Task | null;
  save(task: Task): void;
}

export interface UserRepository {
  list(): User[];
  findById(id: string): User | null;
}

export interface ActivityRepository {
  listByProject(projectId: string): Activity[];
  append(activity: Activity): void;
}

export interface Repositories {
  projects: ProjectRepository;
  tasks: TaskRepository;
  users: UserRepository;
  activities: ActivityRepository;
}

export type Clock = () => Date;
export type EntityPrefix = "act" | "tsk";
export type IdGenerator = (prefix: EntityPrefix) => string;
