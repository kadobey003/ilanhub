import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyAdminToken } from "./admin-jwt.util.js";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization as string | undefined;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Admin token required");
    }
    const secret = process.env.JWT_SECRET ?? "change-me";
    const payload = verifyAdminToken(header.slice(7), secret);
    if (!payload) throw new UnauthorizedException("Invalid admin token");
    req.adminId = payload.sub;
    req.adminRole = payload.role;
    return true;
  }
}
