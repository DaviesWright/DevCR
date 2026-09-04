// Transcribed directly from "CX Workflow: State 2 Operational Playbook" — the base v2.0
// (CX_Workflow_State2_Playbook.md) plus its update (CX_Workflow_State2_Playbook1.md), which
// added a "Cross-Departmental Interaction" block to every numbered step group and a
// standalone department-interactions section (see cx-department-interactions.ts). Each step
// preserves the playbook's own step numbering (groupLabel) and, for Quality & Control checks,
// the ⚠️ notification trigger (recipient + action) verbatim.

export type StepDef = {
  order: number;
  kind: "PROCESS" | "QUALITY_CHECK";
  label: string;
  notificationRecipient?: string;
  notificationAction?: string;
};

export type CrossDepartmentalEntry = { department: string; description: string };

export type TemplateDef = {
  stageNumber: number;
  title: string;
  goal: string;
  trigger: string;
  owner: string;
  sla: string;
  isOpenDesignItem?: boolean;
  steps: { groupLabel: string; crossDepartmental: CrossDepartmentalEntry[]; items: StepDef[] }[];
};

export const CX_PLAYBOOK_TEMPLATES: TemplateDef[] = [
  {
    stageNumber: 1,
    title: "Sales Agreement Preparation (SPA)",
    goal: "Generate, issue, and track the Sales and Purchase Agreement (SPA) for a new client, ensuring it is executed and archived promptly.",
    trigger: "Client reservation confirmation.",
    owner: "Client Experience Officer · Client Experience Supervisor oversight",
    sla: "SPA issued within 2 business days of reservation confirmation",
    steps: [
      {
        groupLabel: "Step 1.1: Access and Verify Client Profile",
        crossDepartmental: [
          { department: "Sales", description: "Verify unit allocation and pricing against reservation record" },
          { department: "Finance", description: "Confirm payment terms are accurate" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Verify the unit allocation, price, and payment terms against the reservation record" },
          { order: 2, kind: "PROCESS", label: "Confirm the client's master list status reflects the current stage" },
          {
            order: 3,
            kind: "QUALITY_CHECK",
            label: "Is the client profile complete and accurate?",
            notificationRecipient: "CE Supervisor",
            notificationAction: "Correct data in client profile",
          },
        ],
      },
      {
        groupLabel: "Step 1.2: Generate and Dispatch SPA",
        crossDepartmental: [
          { department: "Sales", description: "Auto-cc'd on SPA dispatch for visibility and client relationship continuity" },
          { department: "Technology", description: "Ensure SPA template merge fields and auto-dispatch workflow function correctly" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Click the 'Generate SPA' button (system previews merged fields)" },
          { order: 2, kind: "PROCESS", label: "Review the preview for accuracy" },
          { order: 3, kind: "PROCESS", label: "Click 'Approve & Dispatch' (system auto-sends SPA and checks \"SPA submitted to Client\")" },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Is the delivery receipt and read confirmation captured in CRM?",
            notificationRecipient: "CE Officer",
            notificationAction: "Confirm with client/consultant",
          },
          {
            order: 5,
            kind: "QUALITY_CHECK",
            label: "Is the \"SPA submitted to Client\" status updated?",
            notificationRecipient: "CE Officer",
            notificationAction: "Update SPA execution status",
          },
        ],
      },
      {
        groupLabel: "Step 1.3: Receive and Archive Executed SPA",
        crossDepartmental: [
          { department: "Technology", description: "Ensure document archive and status update workflows function correctly" },
          { department: "Sales", description: "Update sales records of SPA completion" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Upload the signed SPA to the client's profile archive folder" },
          { order: 2, kind: "PROCESS", label: "Click the 'Receive Executed SPA' button" },
          {
            order: 3,
            kind: "QUALITY_CHECK",
            label: "Is the signed SPA archived within 48 hours of receipt?",
            notificationRecipient: "CE Officer",
            notificationAction: "Follow up on signed SPA",
          },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Has the master list status auto-updated to \"SPA executed\"?",
            notificationRecipient: "CE Supervisor",
            notificationAction: "Verify master list update",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 2,
    title: "Client Site Visits (During Construction)",
    goal: "Coordinate and manage site visits for clients during the construction phase.",
    trigger: "Client request, or proactive invite sent on schedule.",
    owner: "Client Experience Supervisor & Client Experience Manager · coordinated with Projects / Dev Delivery",
    sla: "Visit confirmed within 3 business days of request",
    isOpenDesignItem: true,
    steps: [
      {
        groupLabel: "Step 2.1: Initiate Visit",
        crossDepartmental: [
          { department: "Fabrico (Construction)", description: "Coordinate site access and safety protocols" },
          { department: "Projects / Dev Delivery", description: "Confirm site readiness and availability of construction team" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Log the visit request against the client and unit record" },
          { order: 2, kind: "PROCESS", label: "Issue the Health & Safety briefing and capture the client's acknowledgement" },
          { order: 3, kind: "PROCESS", label: "Send the visit appointment link to the client" },
        ],
      },
      {
        groupLabel: "Step 2.2: Conduct and Log Visit",
        crossDepartmental: [
          { department: "Fabrico (Construction)", description: "Provide construction progress insights for client communication" },
          { department: "Projects / Dev Delivery", description: "Share project milestone updates for proactive client communication" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "After the visit, log attendance and any client feedback" },
          { order: 2, kind: "PROCESS", label: "Click the 'Update Visit Completion' status button" },
          {
            order: 3,
            kind: "QUALITY_CHECK",
            label: "Is H&S acknowledgement captured before site access?",
            notificationRecipient: "CE Officer",
            notificationAction: "Follow up with client",
          },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Is there a CRM record for 100% of visits?",
            notificationRecipient: "CE Supervisor",
            notificationAction: "Investigate untracked visits",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 3,
    title: "Internal Snagging",
    goal: "Capture, manage, and track the resolution of snags (defects) identified by the development team or internally before client handover.",
    trigger: "Development updates unit with \"completion status\" in CRM, alerting the CE team to schedule an inspection.",
    owner: "Client Experience Supervisor & Client Experience Manager · coordinates with Projects / Dev Delivery",
    sla: "Critical: 48h · Major: 21 days · Minor: 7 days",
    steps: [
      {
        groupLabel: "Step 3.1: Log Snag",
        crossDepartmental: [
          { department: "Fabrico (Construction)", description: "Report snags and coordinate fixes" },
          { department: "Development Team", description: "Auto-assign snags for resolution; provide technical guidance" },
          { department: "Projects", description: "Monitor resolution progress and resource allocation" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Log the snag with photo, location, severity, and unit reference" },
          { order: 2, kind: "PROCESS", label: "System auto-assigns to Development — confirm receipt notification" },
        ],
      },
      {
        groupLabel: "Step 3.2: Monitor and Close Snag",
        crossDepartmental: [
          { department: "Fabrico (Construction)", description: "Verify completion of physical fixes" },
          { department: "Development Team", description: "Provide resolution status updates" },
          { department: "Executive Management", description: "Weekly aged snag report to CSMO and Development Director" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Monitor SLA timer and intervene on at-risk items by escalating" },
          { order: 2, kind: "PROCESS", label: "Upon receiving system alert of resolution completion, validate resolution evidence" },
          { order: 3, kind: "PROCESS", label: "Click the 'Update Snag Completion Status' button to close the snag" },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Are there any critical or major snags open?",
            notificationRecipient: "CE Supervisor, Projects Lead",
            notificationAction: "Resolve snags before handover",
          },
          {
            order: 5,
            kind: "QUALITY_CHECK",
            label: "Is the weekly aged snag report reviewed?",
            notificationRecipient: "CE Manager",
            notificationAction: "Review and action aged snags",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 4,
    title: "Client Inspection & Property Handover",
    goal: "Manage the client's final inspection and the formal handover of the property.",
    trigger: "Development team confirms the unit is \"cleaned & ready\".",
    owner: "Client Experience Officer & Client Experience Supervisor with Client Experience Manager oversight and Team Collections notified",
    sla: "Handover scheduled within 10 business days of handover-ready flag",
    steps: [
      {
        groupLabel: "Step 4.1: Schedule Handover",
        crossDepartmental: [
          { department: "Development Team", description: "Confirm \"cleaned & ready\" status" },
          { department: "Fabrico (Construction)", description: "Ensure final cleaning and preparation complete" },
          { department: "Projects", description: "Coordinate final inspection logistics" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Click the \"cleaned & ready\" status button in the client's profile (auto-invites client with scheduling link)" },
          { order: 2, kind: "PROCESS", label: "Client selects date and time in the system" },
          { order: 3, kind: "PROCESS", label: "CE team confirms internal readiness" },
        ],
      },
      {
        groupLabel: "Step 4.2: Conduct Inspection and Handover",
        crossDepartmental: [
          { department: "Collections", description: "Auto-notified of handover completion to manage financial follow-ups" },
          { department: "ELAN (Facilities Management)", description: "Initiate property handover and ongoing management" },
          { department: "Sales", description: "Update sales records of successful handover" },
          { department: "Executive Management", description: "Track handover completion metrics" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Conduct the inspection (if client identifies snags, log in system per snag management process)" },
          { order: 2, kind: "PROCESS", label: "Sign Inspection and Handover Form; provide client with copy" },
          { order: 3, kind: "PROCESS", label: "Upload signed Inspection & Handover Form to OneDrive/SharePoint (auto-copy to client)" },
          { order: 4, kind: "PROCESS", label: "Click 'Update Handover Completion Status' button (auto-notifies Team Collections, triggers Welcome Pack workflow)" },
          {
            order: 5,
            kind: "QUALITY_CHECK",
            label: "Are the signed handover documents complete and archived?",
            notificationRecipient: "CE Officer",
            notificationAction: "Complete documentation",
          },
          {
            order: 6,
            kind: "QUALITY_CHECK",
            label: "Is the handover blocked by any outstanding critical/major snags?",
            notificationRecipient: "CE Supervisor, Projects Lead",
            notificationAction: "Resolve blocking snags",
          },
          {
            order: 7,
            kind: "QUALITY_CHECK",
            label: "Did the Welcome Pack dispatch trigger fire?",
            notificationRecipient: "CE Officer",
            notificationAction: "Manually trigger or investigate",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 5,
    title: "Client Welcome Pack",
    goal: "Automatically dispatch the Welcome Pack to the new homeowner.",
    trigger: "\"Handover-complete\" status is marked in Stage 04.",
    owner: "Client Experience Officer with Client Experience Supervisor oversight",
    sla: "Welcome Pack dispatched within 24 hours of handover-complete",
    steps: [
      {
        groupLabel: "Step 5.1: Dispatch Pack",
        crossDepartmental: [
          { department: "ELAN (Facilities Management)", description: "Receive client information and property details for ongoing management" },
          { department: "Property Managers", description: "Copied on Welcome Pack for visibility and client relationship continuity" },
          { department: "Sales", description: "Copied on Welcome Pack for client relationship continuity" },
          { department: "Executive Management", description: "Track Welcome Pack dispatch completion" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Upon marking handover complete, Welcome Pack auto-dispatches (copies Property Managers, CE Supervisor & Manager)" },
          { order: 2, kind: "PROCESS", label: "CE team confirms dispatch fired within 24 hours" },
          {
            order: 3,
            kind: "QUALITY_CHECK",
            label: "Is there a corresponding Welcome Pack dispatch for every handover?",
            notificationRecipient: "CE Officer",
            notificationAction: "Manually trigger or investigate",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 6,
    title: "Mortgage Application Support",
    goal: "Support the client through the mortgage application process and ensure timely payment.",
    trigger: "System auto-prompt at T-6 months before property completion date.",
    owner: "Client Experience Supervisor · joint ownership with Finance / Collections",
    sla: "CE engagement initiated within 5 business days of T-6 month alert",
    steps: [
      {
        groupLabel: "Step 6.1: Initiate Support",
        crossDepartmental: [
          { department: "Sales", description: "Coordinate on client financial readiness" },
          { department: "Finance", description: "Monitor mortgage pipeline and financial implications" },
          { department: "Technology", description: "Ensure T-6 month alert system functions correctly" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Receive the T-6 month system prompt" },
          { order: 2, kind: "PROCESS", label: "Contact client to confirm mortgage intent and bank selection" },
          { order: 3, kind: "PROCESS", label: "Log bank selection and documents prepared/submitted" },
        ],
      },
      {
        groupLabel: "Step 6.2: Track and Close",
        crossDepartmental: [
          { department: "Finance / Collections", description: "Receive payment advice and reconcile funds" },
          { department: "Executive Management", description: "Weekly mortgage pipeline report reviewed by CE and Finance" },
          { department: "Development Team", description: "Confirm property completion timeline for mortgage scheduling" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Update mortgage status buttons as bank milestones hit (submitted, approved, disbursed)" },
          { order: 2, kind: "PROCESS", label: "On disbursement, confirm payment advice auto-routed to Collections" },
          { order: 3, kind: "PROCESS", label: "Reconcile receipted funds to unit account and close application record" },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Is the weekly mortgage pipeline report reviewed?",
            notificationRecipient: "CE Manager",
            notificationAction: "Review pipeline report",
          },
          {
            order: 5,
            kind: "QUALITY_CHECK",
            label: "Are there any aged applications (>60 days)?",
            notificationRecipient: "CE Supervisor",
            notificationAction: "Escalate and follow up",
          },
          {
            order: 6,
            kind: "QUALITY_CHECK",
            label: "Did the payment advice successfully route to Collections?",
            notificationRecipient: "CE Officer, Collections",
            notificationAction: "Investigate and reroute",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 7,
    title: "Sublease & Ancillary Agreement Execution",
    goal: "Manage the preparation, execution, and registration of the sublease and ancillary agreements.",
    trigger: "Handover-complete status from Stage 04.",
    owner: "Client Experience Supervisor with Legal",
    sla: "Sublease preparation within 7 days of receipt of Client Details Form; Clients to sign within 14 days of receipt",
    steps: [
      {
        groupLabel: "Step 7.1: Initiate Documentation",
        crossDepartmental: [
          { department: "Legal", description: "Draft and finalize sublease and ancillary agreements" },
          { department: "Sales", description: "Coordinate on client details and agreement terms" },
          { department: "Technology", description: "Ensure auto-reporting and document generation workflows function correctly" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "On handover-complete, system auto-reports client details to Legal" },
          { order: 2, kind: "PROCESS", label: "Legal drafts agreements; CE team monitors progress" },
          { order: 3, kind: "PROCESS", label: "Client executes agreements; CE team uploads signed copies" },
          { order: 4, kind: "PROCESS", label: "Click 'Update Sublease Status' button to reflect execution" },
        ],
      },
      {
        groupLabel: "Step 7.2: Submit and Finalise",
        crossDepartmental: [
          { department: "Legal", description: "Manage Lands Commission submission and registration process" },
          { department: "Executive Management", description: "Track submission status and milestone alerts" },
          { department: "Technology", description: "Ensure milestone tracking and alert system functions correctly" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Submit to Lands Commission and log submission reference" },
          { order: 2, kind: "PROCESS", label: "Track progress and notify client at each milestone" },
          { order: 3, kind: "PROCESS", label: "Archive final registered documents to client profile" },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Is sublease preparation initiated for every handover?",
            notificationRecipient: "CE Supervisor, Legal",
            notificationAction: "Follow up on legal process",
          },
          {
            order: 5,
            kind: "QUALITY_CHECK",
            label: "Is the Lands Commission submission tracked?",
            notificationRecipient: "CE Officer",
            notificationAction: "Track submission status",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 8,
    title: "Client Complaints Management",
    goal: "Capture, manage, and resolve client complaints efficiently and fairly.",
    trigger: "Client lodges a complaint.",
    owner: "Client Experience Supervisor & Client Experience Manager · CSMO oversight · escalation path defined",
    sla: "Acknowledgement within 4h · resolution targets per severity band",
    steps: [
      {
        groupLabel: "Step 8.1: Capture and Assign",
        crossDepartmental: [
          { department: "All Departments", description: "System auto-notifies relevant stakeholders based on complaint category" },
          { department: "Legal", description: "Notified on serious complaints requiring legal review" },
          { department: "Development Team", description: "Notified on construction-related complaints" },
          { department: "Executive Management", description: "Escalation path defined for unresolved complaints" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Log complaint against client and unit, assigning category and severity" },
          { order: 2, kind: "PROCESS", label: "System auto-notifies stakeholder resolution chain" },
        ],
      },
      {
        groupLabel: "Step 8.2: Resolve and Close",
        crossDepartmental: [
          { department: "Finance", description: "Process compensation accruals where policy triggered" },
          { department: "Development Team", description: "Resolve construction-related complaints and provide root cause analysis" },
          { department: "ELAN (Facilities Management)", description: "Resolve property management-related complaints" },
          { department: "Executive Management", description: "Review weekly complaint dashboard by CSMO" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "CE team monitors resolution; escalate if not resolved per SLA" },
          { order: 2, kind: "PROCESS", label: "Upon receiving notification of resolution, verify the fix" },
          { order: 3, kind: "PROCESS", label: "Click 'Close Complaint' button (auto-notifies client of resolution)" },
          { order: 4, kind: "PROCESS", label: "Capture client closure acknowledgement" },
          { order: 5, kind: "PROCESS", label: "Log root cause and preventive action" },
          {
            order: 6,
            kind: "QUALITY_CHECK",
            label: "Are any complaints handled outside the system?",
            notificationRecipient: "CE Supervisor",
            notificationAction: "Enforce system usage",
          },
          {
            order: 7,
            kind: "QUALITY_CHECK",
            label: "Has the complaint breached its SLA?",
            notificationRecipient: "CSMO/CTO/CEO",
            notificationAction: "Escalate per defined path",
          },
          {
            order: 8,
            kind: "QUALITY_CHECK",
            label: "Is compensation accrued correctly?",
            notificationRecipient: "CE Manager, Finance",
            notificationAction: "Investigate and correct",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 9,
    title: "Reports Management",
    goal: "Ensure reports are generated, distributed, and used as the single source of executive truth.",
    trigger: "Scheduled system auto-generation.",
    owner: "Client Experience Team · data stewardship via CRM Admins (Abass / Osbert)",
    sla: "Operational reports refresh within 24 hours; executive reports weekly",
    steps: [
      {
        groupLabel: "Step 9.1: Report Generation",
        crossDepartmental: [
          { department: "Technology (IT)", description: "Maintain CRM and Power BI report generation" },
          { department: "Finance", description: "Review financial reports for accuracy" },
          { department: "Executive Management", description: "Review executive reports weekly" },
          { department: "Steerco", description: "Review reports for conformance oversight" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Reports auto-generate and distribute on schedule" },
          { order: 2, kind: "PROCESS", label: "CE team reviews data for anomalies" },
        ],
      },
      {
        groupLabel: "Step 9.2: Governance and Use",
        crossDepartmental: [
          { department: "Technology (IT)", description: "Validate data integration and reconciliation between systems" },
          { department: "All Departments", description: "Use reports for operational and strategic decision-making" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "CE team serves ad hoc queries via self-service dashboards" },
          { order: 2, kind: "PROCESS", label: "Report catalogue reviewed and refreshed quarterly" },
          {
            order: 3,
            kind: "QUALITY_CHECK",
            label: "Is the report's data freshness and completeness validated on each refresh?",
            notificationRecipient: "CE Manager",
            notificationAction: "Investigate data anomalies",
          },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Is the reconciliation between Microsoft CRM, BC, and Power BI validated monthly?",
            notificationRecipient: "CRM Admins",
            notificationAction: "Validate data connections",
          },
          {
            order: 5,
            kind: "QUALITY_CHECK",
            label: "Are any executive decisions being taken from manually compiled Excel reports instead of the system?",
            notificationRecipient: "CSMO",
            notificationAction: "Enforce system as source of truth",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 10,
    title: "Client Satisfaction Surveys",
    goal: "Measure and track client satisfaction at key touchpoints.",
    trigger: "Key event (e.g., handover) or periodic schedule.",
    owner: "Client Experience Manager · CSMO strategic oversight",
    sla: "Touchpoint surveys within 48h of trigger event",
    isOpenDesignItem: true,
    steps: [
      {
        groupLabel: "Step 10.1: Survey Dispatch",
        crossDepartmental: [
          { department: "Technology (IT)", description: "Integrate survey tool with CRM" },
          { department: "Executive Management", description: "Strategic oversight by CSMO on survey design and analysis" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Surveys auto-dispatched per the trigger" },
          { order: 2, kind: "PROCESS", label: "Responses captured and scored" },
        ],
      },
      {
        groupLabel: "Step 10.2: Follow-up and Analysis",
        crossDepartmental: [
          { department: "Executive Management", description: "Review CSAT/NPS trends quarterly" },
          { department: "All Departments", description: "Use survey insights to improve processes and service delivery" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Low scores auto-create follow-up case with CE owner" },
          { order: 2, kind: "PROCESS", label: "Aggregate scores reviewed at CSMO cadence" },
          {
            order: 3,
            kind: "QUALITY_CHECK",
            label: "Is the response rate above the threshold?",
            notificationRecipient: "CE Manager",
            notificationAction: "Review survey strategy",
          },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Is the closed-loop follow-up rate on low scores tracked?",
            notificationRecipient: "CE Manager",
            notificationAction: "Review follow-up process",
          },
          {
            order: 5,
            kind: "QUALITY_CHECK",
            label: "Is the CSAT/NPS trend being reviewed quarterly by the Executive?",
            notificationRecipient: "CSMO",
            notificationAction: "Schedule executive review",
          },
        ],
      },
    ],
  },
  {
    stageNumber: 11,
    title: "Client Loyalty Management",
    goal: "Manage a loyalty programme to encourage retention and referrals.",
    trigger: "Handover-complete status from Stage 04 for auto-enrolment.",
    owner: "Client Experience Manager · CSMO strategic oversight",
    sla: "Enrolment within 24h of handover-complete; milestones on cadence",
    steps: [
      {
        groupLabel: "Step 11.1: Enrol and Manage",
        crossDepartmental: [
          { department: "Sales", description: "Track and reward client referrals" },
          { department: "Executive Management", description: "Strategic oversight by CSMO on programme performance" },
          { department: "Technology (IT)", description: "Ensure loyalty system rules and workflows function correctly" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Clients auto-enrolled post-handover" },
          { order: 2, kind: "PROCESS", label: "Tier assignments and changes maintained by system rules" },
          { order: 3, kind: "PROCESS", label: "Benefits redeemed via system with audit trail" },
          { order: 4, kind: "PROCESS", label: "Referrals tracked end-to-end and rewards issued" },
          { order: 5, kind: "PROCESS", label: "Milestone and anniversary touchpoints dispatched automatically" },
        ],
      },
      {
        groupLabel: "Step 11.2: Review and Optimise",
        crossDepartmental: [
          { department: "Executive Management", description: "Review programme engagement reporting quarterly" },
          { department: "Finance", description: "Assess commercial performance of loyalty programme" },
          { department: "Sales", description: "Provide feedback on referral programme effectiveness" },
        ],
        items: [
          { order: 1, kind: "PROCESS", label: "Programme engagement reporting reviewed quarterly" },
          { order: 2, kind: "PROCESS", label: "Programme rules reviewed annually against commercial performance" },
          {
            order: 3,
            kind: "QUALITY_CHECK",
            label: "Is the tier distribution consistent with the programme design?",
            notificationRecipient: "CE Manager",
            notificationAction: "Review programme rules",
          },
          {
            order: 4,
            kind: "QUALITY_CHECK",
            label: "Is benefit utilisation and referral conversion tracked?",
            notificationRecipient: "CE Manager",
            notificationAction: "Review utilisation metrics",
          },
        ],
      },
    ],
  },
];
