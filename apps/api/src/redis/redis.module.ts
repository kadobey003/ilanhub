import { Global, Module } from "@nestjs/common";
import { Redis } from "ioredis";
import { REDIS } from "../common/constants.js";

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () => {
        const url = process.env.REDIS_URL ?? "redis://localhost:6450";
        return new Redis(url, { maxRetriesPerRequest: null });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
