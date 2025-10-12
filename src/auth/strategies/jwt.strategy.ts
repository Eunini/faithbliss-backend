import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: (req) => {
        const authHeader = req?.headers?.authorization;
        console.log('JWT Extractor - Raw Authorization header:', authHeader);
        
        if (!authHeader) {
          console.log('No authorization header found');
          return null;
        }
        
        // Handle multiple Bearer prefixes by removing all of them
        let token = authHeader;
        let bearerCount = 0;
        
        // Keep removing Bearer prefixes until there are none left
        while (token.startsWith('Bearer ')) {
          token = token.substring('Bearer '.length).trim();
          bearerCount++;
        }
        
        console.log(`Removed ${bearerCount} Bearer prefix(es), final token length:`, token.length);
        
        // Additional validation
        if (token && token.split('.').length === 3) {
          console.log('Token appears to be valid JWT format');
          return token;
        } else {
          console.log('Token does not appear to be valid JWT format');
          return null;
        }
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Strategy validate called with payload:', JSON.stringify(payload));
    
    // Check if token is expired
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;
      console.log('Token expiry check - Current time:', now, 'Token exp:', exp, 'Expired:', now > exp);
      
      if (now > exp) {
        console.log('Token has expired');
        throw new Error('Token expired');
      }
    }
    
    // Validate payload structure
    if (!payload || !payload.sub || !payload.email) {
      console.log('Invalid payload structure:', payload);
      throw new Error('Invalid token payload');
    }
    
    try {
      const user = await this.authService.validateUser(payload);
      console.log('User validated successfully:', user?.id);
      return user;
    } catch (error) {
      console.log('JWT validation error:', error.message);
      throw error;
    }
  }
}