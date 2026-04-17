import { Processor } from '@nestjs/bullmq';

@Processor('balance')
export class BalanceJobsQueueProcessor {}
