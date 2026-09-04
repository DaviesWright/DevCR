-- CreateEnum
CREATE TYPE "EmailSyncProvider" AS ENUM ('GOOGLE', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "EmailSyncStatus" AS ENUM ('CONNECTED', 'ERROR', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "email_account_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "EmailSyncProvider" NOT NULL,
    "email" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "delta_cursor" TEXT,
    "status" "EmailSyncStatus" NOT NULL DEFAULT 'CONNECTED',
    "last_synced_at" TIMESTAMP(3),
    "last_sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_account_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_emails" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "provider_message_id" TEXT NOT NULL,
    "subject" TEXT,
    "snippet" TEXT,
    "from_email" TEXT NOT NULL,
    "to_emails" TEXT[],
    "direction" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "matched_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synced_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_calendar_events" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "attendee_emails" TEXT[],
    "matched_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synced_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_account_connections_user_id_provider_key" ON "email_account_connections"("user_id", "provider");

-- CreateIndex
CREATE INDEX "synced_emails_matched_customer_id_idx" ON "synced_emails"("matched_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "synced_emails_connection_id_provider_message_id_key" ON "synced_emails"("connection_id", "provider_message_id");

-- CreateIndex
CREATE INDEX "synced_calendar_events_matched_customer_id_idx" ON "synced_calendar_events"("matched_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "synced_calendar_events_connection_id_provider_event_id_key" ON "synced_calendar_events"("connection_id", "provider_event_id");

-- AddForeignKey
ALTER TABLE "email_account_connections" ADD CONSTRAINT "email_account_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_emails" ADD CONSTRAINT "synced_emails_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "email_account_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_emails" ADD CONSTRAINT "synced_emails_matched_customer_id_fkey" FOREIGN KEY ("matched_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_calendar_events" ADD CONSTRAINT "synced_calendar_events_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "email_account_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_calendar_events" ADD CONSTRAINT "synced_calendar_events_matched_customer_id_fkey" FOREIGN KEY ("matched_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

