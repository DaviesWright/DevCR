import { Zap, FileText, Mail, PlayCircle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowsPanel } from "@/components/admin/workflows-panel";
import { TemplatesList } from "@/components/marketing/templates-list";
import { getWorkflows, getRecentWorkflowRuns, getWebhooks } from "@/lib/queries/workflows";
import { getMessageTemplates } from "@/lib/queries/marketing";
import { getCurrentUser } from "@/lib/queries/reference";
import { isSmtpConfigured } from "@/lib/integrations/config";

export default async function AutomationsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const [workflows, runs, webhooks, templates, currentUser] = await Promise.all([
    getWorkflows(),
    getRecentWorkflowRuns(),
    getWebhooks(),
    getMessageTemplates(),
    getCurrentUser(),
  ]);

  const emailTemplates = templates.filter((t) => t.channel === "EMAIL");
  const activeCount = workflows.filter((w) => w.isActive).length;
  const sentCount = runs.filter((r) => r.status === "SUCCESS").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Automations</h1>
        <p className="text-sm text-muted-foreground">
          Trigger → action rules that fire in real time off real CRM events (no schedule) — templates and legal
          documents auto-shared with clients on the milestones you configure, not hardcoded into the app.
        </p>
      </div>

      {!isSmtpConfigured() && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          SMTP isn't configured (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM_EMAIL) — Send Email
          steps still run and log every attempt, they just can't reach a real mailbox until these are set in .env.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Active workflows" value={String(activeCount)} icon={Zap} tone="primary" />
        <KpiCard title="Email templates" value={String(emailTemplates.length)} icon={FileText} tone="info" />
        <KpiCard title="Runs (recent)" value={String(runs.length)} icon={PlayCircle} tone="highlight" />
        <KpiCard title="Successful sends" value={String(sentCount)} icon={Mail} tone="success" />
      </div>

      <Tabs key={searchParams.tab ?? "rules"} defaultValue={searchParams.tab ?? "rules"}>
        <TabsList>
          <TabsTrigger value="rules">Workflow Rules ({workflows.length})</TabsTrigger>
          <TabsTrigger value="templates">Email Templates ({emailTemplates.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks &amp; workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                "When X happens, do Y" — across Leads, Opportunities, Sales milestones, Payments, and Handovers. A
                step can create a task, log a note, call a webhook, or send an email from the library on the right.
              </p>
              <WorkflowsPanel workflows={workflows} runs={runs} webhooks={webhooks} emailTemplates={emailTemplates} currentUserId={currentUser.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email template library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Reusable content referenced by workflow "Send an email" steps (and Marketing campaigns) — edit
                wording here and every workflow using it picks up the change immediately, no code deploy needed.
              </p>
              <TemplatesList templates={templates} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
