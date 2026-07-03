import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { RegionsService } from "./regions.service.js";

@Controller("cities/:cityId/districts")
export class DistrictsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  async findByCity(@Param("cityId") cityId: string) {
    const data = await this.regionsService.findDistrictsByCityId(cityId);
    if (data === null) throw new NotFoundException("City not found");
    return { data };
  }
}
