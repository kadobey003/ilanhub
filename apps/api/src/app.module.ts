import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module.js";
import { RedisModule } from "./redis/redis.module.js";
import { QueueModule } from "./queue/queue.module.js";
import { HealthModule } from "./health/health.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { CategoriesModule } from "./categories/categories.module.js";
import { ListingsModule } from "./listings/listings.module.js";
import { ModerationModule } from "./moderation/moderation.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { MediaModule } from "./media/media.module.js";
import { UsersModule } from "./users/users.module.js";
import { ChannelsModule } from "./channels/channels.module.js";
import { WebhooksModule } from "./webhooks/webhooks.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { BotsModule } from "./bots/bots.module.js";
import { RegionsModule } from "./regions/regions.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { AccountModule } from "./account/account.module.js";
import { SiteModule } from "./site/site.module.js";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    QueueModule,
    HealthModule,
    ProjectsModule,
    CategoriesModule,
    RegionsModule,
    ListingsModule,
    ModerationModule,
    PaymentsModule,
    MediaModule,
    UsersModule,
    AuthModule,
    AccountModule,
    SiteModule,
    ChannelsModule,
    WebhooksModule,
    AnalyticsModule,
    AdminModule,
    BotsModule,
  ],
})
export class AppModule {}
