import {
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { adminManagers, adminManagerProjects, projects, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import { signAdminToken } from "./admin-jwt.util.js";
import { hashPassword, verifyPassword } from "./password.util.js";

@Injectable()
export class AdminAuthService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async managerProjects(managerId: string, role: string) {
    if (role === "super_admin") {
      const all = await this.db
        .select({ id: projects.id, name: projects.name, slug: projects.slug })
        .from(projects)
        .orderBy(projects.name);
      return all;
    }
    return this.db
      .select({ id: projects.id, name: projects.name, slug: projects.slug })
      .from(adminManagerProjects)
      .innerJoin(projects, eq(adminManagerProjects.projectId, projects.id))
      .where(eq(adminManagerProjects.managerId, managerId))
      .orderBy(projects.name);
  }

  async login(email: string, password: string) {
    const [manager] = await this.db
      .select()
      .from(adminManagers)
      .where(eq(adminManagers.email, email.toLowerCase()))
      .limit(1);

    if (!manager || !manager.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await verifyPassword(password, manager.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const secret = process.env.JWT_SECRET ?? "change-me";
    const token = signAdminToken(manager.id, manager.role, secret);
    const managerProjects = await this.managerProjects(manager.id, manager.role);

    return {
      token,
      manager: {
        id: manager.id,
        email: manager.email,
        name: manager.name,
        role: manager.role,
        projects: managerProjects,
      },
    };
  }

  async me(managerId: string) {
    const [manager] = await this.db
      .select({
        id: adminManagers.id,
        email: adminManagers.email,
        name: adminManagers.name,
        role: adminManagers.role,
        isActive: adminManagers.isActive,
        createdAt: adminManagers.createdAt,
      })
      .from(adminManagers)
      .where(eq(adminManagers.id, managerId))
      .limit(1);

    if (!manager) throw new UnauthorizedException("Manager not found");
    const managerProjects = await this.managerProjects(manager.id, manager.role);
    return { data: { ...manager, projects: managerProjects } };
  }

  async ensureDefaultAdmin() {
    const [existing] = await this.db.select().from(adminManagers).limit(1);
    if (existing) return;

    const email = process.env.ADMIN_EMAIL ?? "admin@ilanhub.local";
    const password = process.env.ADMIN_PASSWORD ?? "admin123";
    const hash = await hashPassword(password);

    await this.db.insert(adminManagers).values({
      email,
      passwordHash: hash,
      name: "Super Admin",
      role: "super_admin",
    });
    console.log(`Default admin created: ${email}`);
  }
}
