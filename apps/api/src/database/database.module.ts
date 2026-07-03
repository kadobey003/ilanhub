import { Global, Module } from "@nestjs/common";
import { createDb } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        if (!url) throw new Error("DATABASE_URL is required");
        return createDb(url);
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
