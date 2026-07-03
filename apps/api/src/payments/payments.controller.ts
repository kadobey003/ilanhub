import { Body, Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service.js";
import { CreatePaymentDto } from "./dto/payment.dto.js";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("create")
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Post("webhooks/monopay")
  monopayWebhook(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.paymentsService.handleMonopayWebhook(body, req.headers);
  }

  @Post("webhooks/portmone")
  portmoneWebhook(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.paymentsService.handlePortmoneWebhook(body, req.headers);
  }
}
