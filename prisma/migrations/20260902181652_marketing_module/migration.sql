-- CreateEnum
CREATE TYPE "CustomerSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED', 'FAILED');

-- CreateEnum
CREATE TYPE "MarketingCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MarketingJourneyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JourneyActionType" AS ENUM ('SEND_EMAIL', 'SEND_SMS', 'SEND_WHATSAPP', 'WAIT', 'ADD_TO_SEGMENT', 'REMOVE_FROM_SEGMENT', 'CREATE_TASK');

-- CreateEnum
CREATE TYPE "CustomerJourneyStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXITED');

-- CreateEnum
CREATE TYPE "EngagementEventType" AS ENUM ('PAGE_VIEW', 'PROPERTY_VIEW', 'BROCHURE_DOWNLOAD', 'EMAIL_OPEN', 'EMAIL_CLICK', 'SMS_REPLY', 'WHATSAPP_REPLY', 'SITE_VISIT_ATTENDED', 'PAYMENT_MADE', 'COMPLAINT_SUBMITTED', 'PORTAL_LOGIN', 'CAMPAIGN_SENT');

-- CreateEnum
CREATE TYPE "AIContentType" AS ENUM ('EMAIL_SUBJECT', 'EMAIL_BODY', 'SMS_CONTENT', 'WHATSAPP_CONTENT');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "engagement_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "last_marketing_contact_at" TIMESTAMP(3),
ADD COLUMN     "opt_out_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opt_out_sms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opt_out_whatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentiment" "CustomerSentiment" NOT NULL DEFAULT 'NEUTRAL';

-- CreateTable
CREATE TABLE "marketing_personas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "suggested_channels" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "is_dynamic" BOOLEAN NOT NULL DEFAULT true,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "last_computed_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_segment_members" (
    "id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "manually_added" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_segment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "subject" TEXT,
    "body_html" TEXT,
    "body_text" TEXT,
    "variables" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "persona_id" TEXT,
    "segment_id" TEXT,
    "template_id" TEXT,
    "channel" "MarketingChannel" NOT NULL,
    "objective" TEXT,
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_messages" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "journey_id" TEXT,
    "channel" "MarketingChannel" NOT NULL,
    "template_id" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_events" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_type" "EngagementEventType" NOT NULL,
    "channel" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_journeys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MarketingJourneyStatus" NOT NULL DEFAULT 'DRAFT',
    "segment_id" TEXT,
    "trigger_event_type" "EngagementEventType",
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_journey_steps" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "action_type" "JourneyActionType" NOT NULL,
    "action_config" JSONB NOT NULL,
    "wait_hours" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_journey_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_journeys" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "current_step_id" TEXT,
    "status" "CustomerJourneyStatus" NOT NULL DEFAULT 'ACTIVE',
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_reason" TEXT,

    CONSTRAINT "customer_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_persona_signals" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "persona_id" TEXT,
    "suspected_persona" TEXT NOT NULL,
    "note" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_persona_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_content_logs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "campaign_id" TEXT,
    "content_type" "AIContentType" NOT NULL,
    "prompt_used" JSONB NOT NULL,
    "output" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_content_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "variant_a" JSONB NOT NULL,
    "variant_b" JSONB NOT NULL,
    "winner" TEXT,
    "sample_size" INTEGER,
    "confidence" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_personas_name_key" ON "marketing_personas"("name");

-- CreateIndex
CREATE INDEX "marketing_segment_members_customer_id_idx" ON "marketing_segment_members"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_segment_members_segment_id_customer_id_key" ON "marketing_segment_members"("segment_id", "customer_id");

-- CreateIndex
CREATE INDEX "marketing_messages_customer_id_idx" ON "marketing_messages"("customer_id");

-- CreateIndex
CREATE INDEX "marketing_messages_campaign_id_idx" ON "marketing_messages"("campaign_id");

-- CreateIndex
CREATE INDEX "marketing_messages_journey_id_idx" ON "marketing_messages"("journey_id");

-- CreateIndex
CREATE INDEX "engagement_events_customer_id_occurred_at_idx" ON "engagement_events"("customer_id", "occurred_at");

-- CreateIndex
CREATE INDEX "engagement_events_event_type_occurred_at_idx" ON "engagement_events"("event_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_journey_steps_journey_id_step_order_key" ON "marketing_journey_steps"("journey_id", "step_order");

-- CreateIndex
CREATE INDEX "customer_journeys_customer_id_idx" ON "customer_journeys"("customer_id");

-- CreateIndex
CREATE INDEX "customer_journeys_journey_id_idx" ON "customer_journeys"("journey_id");

-- CreateIndex
CREATE INDEX "lead_persona_signals_lead_id_idx" ON "lead_persona_signals"("lead_id");

-- AddForeignKey
ALTER TABLE "marketing_segments" ADD CONSTRAINT "marketing_segments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_segment_members" ADD CONSTRAINT "marketing_segment_members_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "marketing_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_segment_members" ADD CONSTRAINT "marketing_segment_members_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "marketing_personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "marketing_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_messages" ADD CONSTRAINT "marketing_messages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_messages" ADD CONSTRAINT "marketing_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_messages" ADD CONSTRAINT "marketing_messages_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "marketing_journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_messages" ADD CONSTRAINT "marketing_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_events" ADD CONSTRAINT "engagement_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journeys" ADD CONSTRAINT "marketing_journeys_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "marketing_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journeys" ADD CONSTRAINT "marketing_journeys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_journey_steps" ADD CONSTRAINT "marketing_journey_steps_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "marketing_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "marketing_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_journeys" ADD CONSTRAINT "customer_journeys_current_step_id_fkey" FOREIGN KEY ("current_step_id") REFERENCES "marketing_journey_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_persona_signals" ADD CONSTRAINT "lead_persona_signals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_persona_signals" ADD CONSTRAINT "lead_persona_signals_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "marketing_personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_content_logs" ADD CONSTRAINT "ai_content_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_content_logs" ADD CONSTRAINT "ai_content_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

