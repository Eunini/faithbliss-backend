import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('JWT Guard handleRequest called');
    console.log('Error:', err);
    console.log('User:', user ? 'User found' : 'No user');
    console.log('Info:', info);
    
    const request = context.switchToHttp().getRequest();
    console.log('Authorization header:', request.headers.authorization);
    
    if (err || !user) {
      console.log('Authentication failed:', err?.message || info?.message || 'No user found');
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}