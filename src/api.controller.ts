import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('API Info')
@Controller('api')
export class ApiController {
  @Get()
  @ApiOperation({ summary: 'Get API information and available endpoints' })
  @ApiResponse({
    status: 200,
    description: 'API information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'FaithBliss API' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: 'Christian Dating Platform Backend API' },
        documentation: { type: 'string', example: '/api/docs' },
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2024-10-03T12:00:00.000Z' },
        endpoints: {
          type: 'object',
          properties: {
            auth: { type: 'string', example: '/auth' },
            users: { type: 'string', example: '/users' },
            matches: { type: 'string', example: '/matches' },
            messages: { type: 'string', example: '/messages' },
            community: { type: 'string', example: '/community' },
            discover: { type: 'string', example: '/discover' },
          },
        },
      },
    },
  })
  getApiInfo() {
    return {
      name: 'FaithBliss API',
      version: '1.0.0',
      description: 'Christian Dating Platform Backend API',
      documentation: '/api/docs',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/auth',
        users: '/users',
        matches: '/matches',
        messages: '/messages',
        community: '/community',
        discover: '/discover',
      },
      features: [
        'JWT Authentication',
        'Google OAuth2',
        'Real-time Messaging',
        'User Matching',
        'Community Features',
        'Discovery System',
      ],
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2024-10-03T12:00:00.000Z' },
        uptime: { type: 'number', example: 123456 },
      },
    },
  })
  getHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}