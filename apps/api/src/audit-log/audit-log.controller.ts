// audit-log.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    HttpException,
    HttpStatus,
    Req,
    ParseIntPipe,
    ParseEnumPipe,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { AuditLogService } from './audit-log.service';
  import { CreateAuditLogDto, ResourceType } from './dto';
  
  @Controller('audit-logs')
  export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) {}
  
    // 최근 활동 조회 (관리자 대시보드용)
    @Get('recent')
    async getRecentActivities(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
      try {
        const activities = await this.auditLogService.getRecentActivities(limit ?? 10);
        return {
          success: true,
          message: '최근 활동을 성공적으로 조회했습니다.',
          data: activities,
        };
      } catch (error) {
        console.error('최근 활동 조회 실패:', error);
        throw new HttpException('최근 활동 조회에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    // 감사 로그 생성
    @Post()
    async createAuditLog(@Body() createAuditLogDto: CreateAuditLogDto, @Req() req: Request) {
      try {
        // 프록시 환경 고려한 IP 추출
        const forwarded = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
        const ipAddress = forwarded || req.ip || (req.socket as any)?.remoteAddress || undefined;
        const userAgent = req.headers['user-agent'];
  
        const auditLog = await this.auditLogService.createAuditLog({
          ...createAuditLogDto,
          ipAddress,
          userAgent,
        });
  
        return {
          success: true,
          message: '감사 로그가 성공적으로 생성되었습니다.',
          data: auditLog,
        };
      } catch (error) {
        console.error('감사 로그 생성 실패:', error);
        throw new HttpException('감사 로그 생성에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    // 사용자별 감사 로그 조회
    @Get('user/:userId')
    async getAuditLogsByUser(
      @Param('userId') userId: string,
      @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ) {
      try {
        const auditLogs = await this.auditLogService.getAuditLogsByUser(userId, limit ?? 50);
        return {
          success: true,
          message: '사용자별 감사 로그를 성공적으로 조회했습니다.',
          data: auditLogs,
        };
      } catch (error) {
        console.error('사용자별 감사 로그 조회 실패:', error);
        throw new HttpException('사용자별 감사 로그 조회에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    // 리소스별 감사 로그 조회 (entity → resource로 변경)
    @Get('resource/:resource/:resourceId')
    async getAuditLogsByResource(
      @Param('resource', new ParseEnumPipe(ResourceType)) resource: ResourceType,
      @Param('resourceId') resourceId: string,
    ) {
      try {
        const auditLogs = await this.auditLogService.getAuditLogsByResource(resource, resourceId);
        return {
          success: true,
          message: '리소스별 감사 로그를 성공적으로 조회했습니다.',
          data: auditLogs,
        };
      } catch (error) {
        console.error('리소스별 감사 로그 조회 실패:', error);
        throw new HttpException('리소스별 감사 로그 조회에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }