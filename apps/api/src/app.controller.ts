import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get app status' })
  @ApiResponse({ status: 200, description: 'App is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthz')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'App is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}