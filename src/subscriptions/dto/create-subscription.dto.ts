import { IsEnum } from 'class-validator';
import { SubscriptionPlan } from '../enum/subscription-plan.enum';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}
