// freelance.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { FreelanceService, CreateBidDto, CreateMilestoneDto, SubmitMilestoneDto } from './freelance.service';
import { CreateFreelanceJobDto } from './dto/create-freelance-job.dto';

@ApiTags('freelance')
@Controller('freelance')
export class FreelanceController {
  constructor(private readonly svc: FreelanceService) { }

  @Get('categories')
  getCategories() { return this.svc.getCategories(); }

  @Get('jobs')
  findJobs(@Query() q: { q?: string; category?: string; page?: number; limit?: number }) { return this.svc.findJobs(q); }

  @Get('jobs/:id')
  findJob(@Param('id') id: string) { return this.svc.findJobById(id); }

  @Post('jobs')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  createJob(@CurrentUser() u: CurrentUserPayload, @Body() dto: CreateFreelanceJobDto) { return this.svc.createJob(u.userId, dto); }

  @Patch('jobs/:id/status')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  updateJobStatus(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
    @Body() dto: { status: 'COMPLETED' | 'CANCELLED' }
  ) { return this.svc.updateJobStatus(id, u.userId, dto.status); }

  @Post('jobs/:id/bids')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  submitBid(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload, @Body() dto: CreateBidDto) { return this.svc.submitBid(u.userId, id, dto); }

  @Patch('bids/:id/accept')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  acceptBid(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.svc.acceptBid(id, u.userId); }

  @Get('my-bids')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  myBids(@CurrentUser() u: CurrentUserPayload) { return this.svc.getMyBids(u.userId); }

  @Get('my-contracts')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  myContracts(@CurrentUser() u: CurrentUserPayload) { return this.svc.getMyContracts(u.userId); }

  @Get('contracts/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  contract(@Param('id') id: string) { return this.svc.getContract(id); }

  // ── Milestone routes ───────────────────────────────────────────────────────

  @Post('contracts/:id/milestones')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  createMilestone(
    @Param('id') contractId: string,
    @CurrentUser() u: CurrentUserPayload,
    @Body() dto: CreateMilestoneDto,
  ) { return this.svc.createMilestone(contractId, u.userId, dto); }

  @Patch('milestones/:id/start')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  startMilestone(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) {
    return this.svc.startMilestone(id, u.userId);
  }

  @Post('milestones/:id/submit')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  submitMilestone(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
    @Body() dto: SubmitMilestoneDto,
  ) { return this.svc.submitMilestone(id, u.userId, dto); }

  @Patch('milestones/:id/approve')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  approveMilestone(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.svc.approveMilestone(id, u.userId); }

  @Patch('milestones/:id/revision')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  requestRevision(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) {
    return this.svc.requestRevision(id, u.userId);
  }

  // ── Dispute ────────────────────────────────────────────────────────────────

  @Patch('milestones/:id/approve-legacy')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  approveMilestoneLegacy(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.svc.approveMilestone(id, u.userId); }

  @Post('disputes')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  createDispute(@CurrentUser() u: CurrentUserPayload, @Body() dto: { contractId: string; reason: string; evidenceUrls: string[] }) { return this.svc.createDispute(u.userId, dto); }
}
