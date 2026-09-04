// Transcribed from the "Cross-Departmental Interactions" section added in
// CX_Workflow_State2_Playbook1.md — the ongoing (not per-step) relationship between the CX
// team and each other department at Devtraco Group.

export type DepartmentInteractionDef = {
  department: string;
  keyContact: string;
  rows: { interactionType: string; frequency: string; keyActivities: string }[];
};

export const CX_DEPARTMENT_INTERACTIONS: DepartmentInteractionDef[] = [
  {
    department: "Executive Management",
    keyContact: "CSMO (Chief Sales & Marketing Officer), SteerCo",
    rows: [
      { interactionType: "Strategic Reporting", frequency: "Weekly", keyActivities: "Executive reports on SPA status, handovers, complaints, and client satisfaction" },
      { interactionType: "Escalation Management", frequency: "As needed", keyActivities: "Escalation of SLA breaches, critical complaints, and compensation issues" },
      { interactionType: "Programme Oversight", frequency: "Quarterly", keyActivities: "Review of loyalty programme performance and client satisfaction trends" },
    ],
  },
  {
    department: "Technology (IT / Dynamics Team)",
    keyContact: "CRM Admins (Abass / Osbert), IT Department",
    rows: [
      { interactionType: "System Readiness", frequency: "Ongoing", keyActivities: "Ensure CRM, Business Central, and Power BI are operational and integrated" },
      { interactionType: "Workflow Automation", frequency: "As needed", keyActivities: "Configure and troubleshoot triggers, SLA timers, and auto-notifications" },
      { interactionType: "Data Integrity", frequency: "Monthly", keyActivities: "Validate reconciliation between systems; enforce Single Customer ID framework" },
      { interactionType: "User Access", frequency: "As needed", keyActivities: "Manage role-based access and permissions for CX team" },
    ],
  },
  {
    department: "Sales Department",
    keyContact: "Head of Sales, Sales Consultants",
    rows: [
      { interactionType: "Client Handoff", frequency: "Per client", keyActivities: "Transfer client details from sales to CX post-reservation" },
      { interactionType: "SPA Coordination", frequency: "Per client", keyActivities: "Auto-cc Sales on SPA dispatch; update on SPA execution status" },
      { interactionType: "Referral Tracking", frequency: "Ongoing", keyActivities: "Track client referrals and reward issuance through loyalty programme" },
      { interactionType: "Compensation Events", frequency: "As needed", keyActivities: "Notify Head of Sales on compensation triggers for clients" },
    ],
  },
  {
    department: "Development Team",
    keyContact: "Development Director, Projects Lead",
    rows: [
      { interactionType: "Project Milestones", frequency: "As needed", keyActivities: "Receive updates on project completion status" },
      { interactionType: "Snag Management", frequency: "Daily", keyActivities: "Auto-assign and track resolution of snags raised during inspections" },
      { interactionType: "Handover Readiness", frequency: "Per unit", keyActivities: "Confirm \"cleaned & ready\" status for unit handover" },
      { interactionType: "Quality Feedback", frequency: "Monthly", keyActivities: "Feed repeat snag analysis into development quality loop" },
    ],
  },
  {
    department: "Fabrico (Construction)",
    keyContact: "Construction Manager, Site Supervisors",
    rows: [
      { interactionType: "Site Visits", frequency: "Per request", keyActivities: "Coordinate and schedule client site visits during construction" },
      { interactionType: "Snag Resolution", frequency: "Per snag", keyActivities: "Execute physical fixes for snags identified during inspections" },
      { interactionType: "Unit Readiness", frequency: "Per unit", keyActivities: "Prepare unit for handover and final inspection" },
      { interactionType: "Construction Progress", frequency: "As needed", keyActivities: "Provide updates for client communication and site visit preparation" },
    ],
  },
  {
    department: "ELAN (Facilities Management)",
    keyContact: "Property Managers, Facilities Management Team",
    rows: [
      { interactionType: "Client Handoff", frequency: "Post-handover", keyActivities: "Copy Property Managers on Welcome Pack for ongoing client management" },
      { interactionType: "Client Service", frequency: "Ongoing", keyActivities: "Coordinate on property management-related client requests and complaints" },
      { interactionType: "Quality Feedback", frequency: "Monthly", keyActivities: "Feed facility-related feedback into service improvement cycles" },
      { interactionType: "Amenity Management", frequency: "Ongoing", keyActivities: "Coordinate on amenity-related client communication and events" },
    ],
  },
  {
    department: "Finance / Collections",
    keyContact: "Finance Director, Collections Team",
    rows: [
      { interactionType: "Mortgage Follow-up", frequency: "As needed", keyActivities: "Ensure timely mortgage disbursement and reconciliation" },
      { interactionType: "Compensation Accrual", frequency: "Per complaint", keyActivities: "Process compensation accruals for complaints as per policy" },
      { interactionType: "Payment Advice", frequency: "Per mortgage", keyActivities: "Route payment advice to Collections; reconcile funds" },
      { interactionType: "Financial Reporting", frequency: "Weekly", keyActivities: "Review weekly mortgage pipeline and aged application reports" },
    ],
  },
  {
    department: "Legal",
    keyContact: "Legal Department",
    rows: [
      { interactionType: "Sublease Preparation", frequency: "Per handover", keyActivities: "Draft and finalize sublease, ancillary, and consent agreements" },
      { interactionType: "Lands Commission", frequency: "Per submission", keyActivities: "Submit and track agreements at Lands Commission" },
      { interactionType: "Complaint Support", frequency: "As needed", keyActivities: "Provide legal guidance on serious complaints and disputes" },
      { interactionType: "Documentation Review", frequency: "As needed", keyActivities: "Review document templates and client details for legal compliance" },
    ],
  },
  {
    department: "SteerCo (Governance & Oversight)",
    keyContact: "SteerCo (Vendor Governance, GEMS Programme)",
    rows: [
      { interactionType: "Conformance Oversight", frequency: "Periodic", keyActivities: "Review reports to ensure CX workflow conforms to defined processes" },
      { interactionType: "Performance Review", frequency: "Quarterly", keyActivities: "Review KPIs, complaint trends, and client satisfaction metrics" },
      { interactionType: "Governance Advisory", frequency: "As needed", keyActivities: "Provide strategic guidance on vendor governance and programme oversight" },
    ],
  },
];
