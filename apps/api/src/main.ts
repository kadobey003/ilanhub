import { loadMonorepoEnv } from "@ilanhub/shared/load-env";
loadMonorepoEnv();

import "reflect-metadata";
import { join } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser("json", { limit: "12mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "12mb" });
  app.setGlobalPrefix("api");
  app.enableCors();
  app.useStaticAssets(join(process.cwd(), "uploads", "listings"), {
    prefix: "/api/uploads/listings/",
  });
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API running on :${port}`);
}

bootstrap();
