import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import type { Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";

@Injectable()
export class HealthService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async check() {
    await this.db.execute(sql`SELECT 1`);
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
