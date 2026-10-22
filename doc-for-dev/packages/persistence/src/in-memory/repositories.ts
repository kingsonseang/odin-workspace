import type {
  Activity,
  ActivityRepository,
  Project,
  ProjectRepository,
  Repositories,
  Task,
  TaskRepository,
  User,
  UserRepository
} from "@forgeboard/domain";
import { createSeedData, type SeedData } from "../seed";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();

  constructor(seed: Project[]) {
    for (const project of seed) {
      this.projects.set(project.id, clone(project));
    }
  }

  list(): Project[] {
    return [...this.projects.values()].map(clone);
  }

  findById(id: string): Project | null {
    const project = this.projects.get(id);
    return project ? clone(project) : null;
  }

  save(project: Project): void {
    this.projects.set(project.id, clone(project));
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  constructor(seed: Task[]) {
    for (const task of seed) {
      this.tasks.set(task.id, clone(task));
    }
  }

  listByProject(projectId: string): Task[] {
    return [...this.tasks.values()]
      .filter((task) => task.projectId === projectId)
      .map(clone);
  }

  findById(id: string): Task | null {
    const task = this.tasks.get(id);
    return task ? clone(task) : null;
  }

  save(task: Task): void {
    this.tasks.set(task.id, clone(task));
  }
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  constructor(seed: User[]) {
    for (const user of seed) {
      this.users.set(user.id, clone(user));
    }
  }

  list(): User[] {
    return [...this.users.values()].map(clone);
  }

  findById(id: string): User | null {
    const user = this.users.get(id);
    return user ? clone(user) : null;
  }
}

export class InMemoryActivityRepository implements ActivityRepository {
  private readonly activities: Activity[] = [];

  constructor(seed: Activity[]) {
    this.activities = seed.map(clone);
  }

  listByProject(projectId: string): Activity[] {
    return this.activities
      .filter((activity) => activity.projectId === projectId)
      .map(clone);
  }

  append(activity: Activity): void {
    this.activities.push(clone(activity));
  }
}

export function createInMemoryRepositories(
  seed: SeedData = createSeedData()
): Repositories {
  return {
    projects: new InMemoryProjectRepository(seed.projects),
    tasks: new InMemoryTaskRepository(seed.tasks),
    users: new InMemoryUserRepository(seed.users),
    activities: new InMemoryActivityRepository(seed.activities)
  };
}
