import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyToken } from "./jwt.util.js";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization as string | undefined;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token required");
    }
    const secret = process.env.JWT_SECRET ?? "change-me";
    const payload = verifyToken(header.slice(7), secret);
    if (!payload) throw new UnauthorizedException("Invalid token");
    req.userId = payload.sub;
    return true;
  }
}
