# CX Workflow: State 2 Operational Playbook

## Implementation Guide

*System-driven and ERP-enabled · Dynamics 365 as single source of truth*

**Version:** 2.0  
**Last Updated:** [Insert Date]  
**Document Owner:** Client Experience Team

---

## Table of Contents

1. [Overview](#overview)
2. [Tab 01: Sales Agreement Preparation (SPA)](#tab-01-sales-agreement-preparation-spa)
3. [Tab 02: Client Site Visits (During Construction)](#tab-02-client-site-visits-during-construction)
4. [Tab 03: Internal Snagging](#tab-03-internal-snagging)
5. [Tab 04: Client Inspection & Property Handover](#tab-04-client-inspection--property-handover)
6. [Tab 05: Client Welcome Pack](#tab-05-client-welcome-pack)
7. [Tab 06: Mortgage Application Support](#tab-06-mortgage-application-support)
8. [Tab 07: Sublease & Ancillary Agreement Execution](#tab-07-sublease--ancillary-agreement-execution)
9. [Tab 08: Client Complaints Management](#tab-08-client-complaints-management)
10. [Tab 09: Reports Management](#tab-09-reports-management)
11. [Tab 10: Client Satisfaction Surveys](#tab-10-client-satisfaction-surveys)
12. [Tab 11: Client Loyalty Management](#tab-11-client-loyalty-management)
13. [Cross-Cutting Dependencies](#cross-cutting-dependencies)
14. [Open Design Items](#open-design-items)
15. [Notification Matrix](#notification-matrix)

---

## Overview

This document outlines the step-by-step operational workflow for the Client Experience (CE) team, structured as a sequential menu-driven interface. Each section represents a primary tab within the CE team's workspace in Microsoft Dynamics 365.

### Core Principle

The system (Dynamics 365) is the single source of truth. The workflow is event-driven, with CE actions primarily consisting of responding to system prompts and verifying completion of stages by clicking status update buttons.

### Key for Checklists

| Symbol | Meaning |
|--------|---------|
| ☐ DONE | Item has been configured and is ready |
| ☐ PENDING | Item requires configuration or resolution |
| ☐ [ ] | Process step to be completed |
| ⚠️ | Notification trigger condition |

---

## Tab 01: Sales Agreement Preparation (SPA)

**Goal:** Generate, issue, and track the Sales and Purchase Agreement (SPA) for a new client, ensuring it is executed and archived promptly.

**Trigger:** Client reservation confirmation.

**Owner:** Client Experience Officer · Client Experience Supervisor oversight

**SLA:** SPA issued within 2 business days of reservation confirmation

---

### Step-by-Step Process & Checklists

#### Step 1.1: Access and Verify Client Profile

**Process:** Search and open the client's profile in Dynamics 365 CE using their BC Number or email address.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Single Customer ID schema (BC Number anchored) is live with unique constraint enforced | ☐ DONE |
| Unit → Development → SPA relationship configured and tested | ☐ DONE |
| Role-based access for CE user group defined and permissions tested | ☐ DONE |
| Audit log enabled on SPA generation and dispatch events | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 1.1.1:** Verify the unit allocation, price, and payment terms against the reservation record
- [ ] **Step 1.1.2:** Confirm the client's master list status reflects the current stage

**Quality & Control Verification:**
- [ ] **Check:** Is the client profile complete and accurate?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor to correct data**

---

#### Step 1.2: Generate and Dispatch SPA

**Process:** The system auto-populates the SPA template and dispatches it. The CE officer oversees this step.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| SPA template library uploaded with merge fields for all client, unit, and pricing variables | ☐ DONE |
| Automated dispatch workflow configured with auto-cc rule to Sales Consultant and Head of Sales | ☐ DONE |
| Document archive folder structure per client profile provisioned | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 1.2.1:** Click the 'Generate SPA' button (system previews merged fields)
- [ ] **Step 1.2.2:** Review the preview for accuracy
- [ ] **Step 1.2.3:** Click 'Approve & Dispatch' (system auto-sends SPA and checks "SPA submitted to Client")

**Quality & Control Verification:**
- [ ] **Check:** Is the delivery receipt and read confirmation captured in CRM?
  - ⚠️ **If NOT checked → Send notification to CE Officer to confirm with client/consultant**
- [ ] **Check:** Is the "SPA submitted to Client" status updated?
  - ⚠️ **If NOT checked → Send notification to CE Officer**

---

#### Step 1.3: Receive and Archive Executed SPA

**Process:** Upon receiving the signed SPA from the client, the CE officer archives it and updates the status.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| System-generated reminders configured to prompt CE team to share executed SPAs within 48 hours | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 1.3.1:** Upload the signed SPA to the client's profile archive folder
- [ ] **Step 1.3.2:** Click the 'Receive Executed SPA' button

**Quality & Control Verification:**
- [ ] **Check:** Is the signed SPA archived within 48 hours of receipt?
  - ⚠️ **If NOT checked → Send notification to CE Officer**
- [ ] **Check:** Has the master list status auto-updated to "SPA executed"?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor**

---

## Tab 02: Client Site Visits (During Construction)

**Goal:** Coordinate and manage site visits for clients during the construction phase.

**⚠️ OPEN DESIGN ITEM:** Scheduling surface (self-service portal vs. CE-mediated) and virtual tour options for diaspora clients to be finalised.

**Trigger:** Client request, or proactive invite sent on schedule.

**Owner:** Client Experience Supervisor & Client Experience Manager · coordinated with Projects / Dev Delivery

**SLA:** Visit confirmed within 3 business days of request

---

### Step-by-Step Process & Checklists

#### Step 2.1: Initiate Visit

**Process:** A visit request is received, or a scheduled reminder prompts a proactive invite.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Site visit entity and scheduling calendar configured in Microsoft CRM CE | ☐ DONE |
| Automated reminder sequence configured (T-3 days, T-1 day) | ☐ DONE |
| Health & safety briefing digitised and linked to visit record | ☐ DONE |
| **OPEN ITEM:** Client self-service scheduling surface agreed (portal, form, or CE-mediated) | ☐ PENDING |
| **OPEN ITEM:** Virtual tour option assessed and scoped for diaspora clients | ☐ PENDING |

**Process Execution (Per Instance):**
- [ ] **Step 2.1.1:** Log the visit request against the client and unit record
- [ ] **Step 2.1.2:** Issue the Health & Safety briefing and capture the client's acknowledgement
- [ ] **Step 2.1.3:** Send the visit appointment link to the client

---

#### Step 2.2: Conduct and Log Visit

**Process:** The visit is conducted, and attendance and feedback are recorded.

**Process Execution (Per Instance):**
- [ ] **Step 2.2.1:** After the visit, log attendance and any client feedback
- [ ] **Step 2.2.2:** Click the 'Update Visit Completion' status button

**Quality & Control Verification:**
- [ ] **Check:** Is H&S acknowledgement captured before site access?
  - ⚠️ **If NOT checked → Send notification to CE Officer to follow up**
- [ ] **Check:** Is there a CRM record for 100% of visits?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor**

---

## Tab 03: Internal Snagging

**Goal:** Capture, manage, and track the resolution of snags (defects) identified by the development team or internally before client handover.

**Trigger:** Development updates unit with "completion status" in CRM, alerting the CE team to schedule an inspection.

**Owner:** Client Experience Supervisor & Client Experience Manager · coordinates with Projects / Dev Delivery

**SLA:** Critical: 48h · Major: 21 days · Minor: 7 days

---

### Step-by-Step Process & Checklists

#### Step 3.1: Log Snag

**Process:** During an internal inspection, snags are captured and logged into the system.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Snag case entity configured with severity, location, unit, and photo fields | ☐ DONE |
| Auto-assignment rules to Development team by development/severity configured | ☐ DONE |
| SLA timers defined per snag severity (Critical: 48h, Major: 21 days, Minor: 7 days) | ☐ DONE |
| Status transitions and resolution evidence requirements configured | ☐ DONE |
| Snag dashboard built and shared with CE, Development, and Projects | ☐ DONE |
| Escalation rules configured for overdue items | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 3.1.1:** Log the snag with photo, location, severity, and unit reference
- [ ] **Step 3.1.2:** System auto-assigns to Development — confirm receipt notification

---

#### Step 3.2: Monitor and Close Snag

**Process:** CE monitors the resolution process and closes the snag once evidence is validated.

**Process Execution (Per Instance):**
- [ ] **Step 3.2.1:** Monitor SLA timer and intervene on at-risk items by escalating
- [ ] **Step 3.2.2:** Upon receiving system alert of resolution completion, validate resolution evidence
- [ ] **Step 3.2.3:** Click the 'Update Snag Completion Status' button to close the snag

**Quality & Control Verification:**
- [ ] **Check:** Are there any critical or major snags open?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor and Projects lead** *(This will also block handover in Stage 04)*
- [ ] **Check:** Is the weekly aged snag report reviewed?
  - ⚠️ **If NOT checked → Send notification to CE Manager**

---

## Tab 04: Client Inspection & Property Handover

**Goal:** Manage the client's final inspection and the formal handover of the property.

**Trigger:** Development team confirms the unit is "cleaned & ready".

**Owner:** Client Experience Officer & Client Experience Supervisor with Client Experience Manager oversight and Team Collections notified

**SLA:** Handover scheduled within 10 business days of handover-ready flag

---

### Step-by-Step Process & Checklists

#### Step 4.1: Schedule Handover

**Process:** The system auto-invites the client to schedule their inspection.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Handover scheduler configured with link to client self-selection | ☐ DONE |
| Snag status pre-check rule configured to block handover if critical/major snags open | ☐ DONE |
| E-signature or scan-and-upload path tested end-to-end | ☐ DONE |
| Digital handover pack template configured and version-controlled | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 4.1.1:** Click the "cleaned & ready" status button in the client's profile (auto-invites client with scheduling link)
- [ ] **Step 4.1.2:** Client selects date and time in the system
- [ ] **Step 4.1.3:** CE team confirms internal readiness

---

#### Step 4.2: Conduct Inspection and Handover

**Process:** The handover is conducted, and snags (if any) are captured. The handover is completed.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Signed document upload routing and auto-copy rules in place | ☐ DONE |
| Welcome Pack trigger dependency confirmed on handover-complete status | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 4.2.1:** Conduct the inspection
  - If client identifies snags → log in system (follow snag management process)
- [ ] **Step 4.2.2:** Sign Inspection and Handover Form; provide client with copy
- [ ] **Step 4.2.3:** Upload signed Inspection & Handover Form to OneDrive/SharePoint (auto-copy to client)
- [ ] **Step 4.2.4:** Click 'Update Handover Completion Status' button
  - Auto-notifies Team Collections
  - Triggers Welcome Pack workflow (Stage 05)

**Quality & Control Verification:**
- [ ] **Check:** Are the signed handover documents complete and archived?
  - ⚠️ **If NOT checked → Send notification to CE Officer**
- [ ] **Check:** Is the handover blocked by any outstanding critical/major snags?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor and Projects lead**
- [ ] **Check:** Did the Welcome Pack dispatch trigger fire?
  - ⚠️ **If NOT checked → Send notification to CE Officer**

---

## Tab 05: Client Welcome Pack

**Goal:** Automatically dispatch the Welcome Pack to the new homeowner.

**Trigger:** "Handover-complete" status is marked in Stage 04.

**Owner:** Client Experience Officer with Client Experience Supervisor oversight

**SLA:** Welcome Pack dispatched within 24 hours of handover-complete

---

### Step-by-Step Process & Checklists

#### Step 5.1: Dispatch Pack

**Process:** The system automatically sends the Welcome Pack. The CE team confirms it was dispatched correctly.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Handover-complete status configured to trigger dispatch workflow | ☐ DONE |
| Welcome Pack template content approved and version-controlled | ☐ DONE |
| Property Manager auto-cc rule per development configured | ☐ DONE |
| Dispatch log and receipt confirmation captured in client profile | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 5.1.1:** Upon marking handover complete, Welcome Pack auto-dispatches (copies Property Managers, CE Supervisor & Manager)
- [ ] **Step 5.1.2:** CE team confirms dispatch fired within 24 hours

**Quality & Control Verification:**
- [ ] **Check:** Is there a corresponding Welcome Pack dispatch for every handover?
  - ⚠️ **If NOT checked → Send notification to CE Officer**

---

## Tab 06: Mortgage Application Support

**Goal:** Support the client through the mortgage application process and ensure timely payment.

**Trigger:** System auto-prompt at T-6 months before property completion date.

**Owner:** Client Experience Supervisor · joint ownership with Finance / Collections

**SLA:** CE engagement initiated within 5 business days of T-6 month alert

---

### Step-by-Step Process & Checklists

#### Step 6.1: Initiate Support

**Process:** The CE team receives a prompt and contacts the client.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Pre-completion alert rule configured at T-6 months | ☐ DONE |
| Mortgage status field and status transitions defined | ☐ DONE |
| Bank-specific document checklists templated in system | ☐ DONE |
| Data protection review completed for mortgage-related client data | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 6.1.1:** Receive the T-6 month system prompt
- [ ] **Step 6.1.2:** Contact client to confirm mortgage intent and bank selection
- [ ] **Step 6.1.3:** Log bank selection and documents prepared/submitted

---

#### Step 6.2: Track and Close

**Process:** The CE team tracks the mortgage milestones and ensures funds are received.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Payment advice auto-routing to Collections/Finance configured | ☐ DONE |
| Aged application dashboard built for CE and Finance | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 6.2.1:** Update mortgage status buttons as bank milestones hit (submitted, approved, disbursed)
- [ ] **Step 6.2.2:** On disbursement, confirm payment advice auto-routed to Collections
- [ ] **Step 6.2.3:** Reconcile receipted funds to unit account and close application record

**Quality & Control Verification:**
- [ ] **Check:** Is the weekly mortgage pipeline report reviewed?
  - ⚠️ **If NOT checked → Send notification to CE Manager**
- [ ] **Check:** Are there any aged applications (>60 days)?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor**
- [ ] **Check:** Did the payment advice successfully route to Collections?
  - ⚠️ **If NOT checked → Send notification to CE Officer and Collections**

---

## Tab 07: Sublease & Ancillary Agreement Execution

**Goal:** Manage the preparation, execution, and registration of the sublease and ancillary agreements.

**Trigger:** Handover-complete status from Stage 04.

**Owner:** Client Experience Supervisor with Legal

**SLA:** Sublease preparation within 7 days of receipt of Client Details Form; Clients to sign within 14 days of receipt

---

### Step-by-Step Process & Checklists

#### Step 7.1: Initiate Documentation

**Process:** The system auto-reports client details to Legal. The CE team confirms the process is underway.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Client details auto-report to Legal configured with trigger on handover-complete | ☐ DONE |
| Legal document generation templates configured (sublease, ancillary, consents) | ☐ DONE |
| Document archive with version control per client profile | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 7.1.1:** On handover-complete, system auto-reports client details to Legal
- [ ] **Step 7.1.2:** Legal drafts agreements; CE team monitors progress
- [ ] **Step 7.1.3:** Client executes agreements; CE team uploads signed copies
- [ ] **Step 7.1.4:** Click 'Update Sublease Status' button to reflect execution

---

#### Step 7.2: Submit and Finalise

**Process:** The agreements are submitted to the Lands Commission and tracked.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Lands Commission submission tracking fields and milestone alerts configured | ☐ DONE |
| Proactive client status update rules configured at each milestone | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 7.2.1:** Submit to Lands Commission and log submission reference
- [ ] **Step 7.2.2:** Track progress and notify client at each milestone
- [ ] **Step 7.2.3:** Archive final registered documents to client profile

**Quality & Control Verification:**
- [ ] **Check:** Is sublease preparation initiated for every handover?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor and Legal**
- [ ] **Check:** Is the Lands Commission submission tracked?
  - ⚠️ **If NOT checked → Send notification to CE Officer**

---

## Tab 08: Client Complaints Management

**Goal:** Capture, manage, and resolve client complaints efficiently and fairly.

**Trigger:** Client lodges a complaint.

**Owner:** Client Experience Supervisor & Client Experience Manager · CSMO oversight · escalation path defined

**SLA:** Acknowledgement within 4h · resolution targets per severity band

---

### Step-by-Step Process & Checklists

#### Step 8.1: Capture and Assign

**Process:** The complaint is logged in the system and routed to the correct stakeholder.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Complaint case entity configured with category, severity, and root cause fields | ☐ DONE |
| Stakeholder notification tree defined per complaint category | ☐ DONE |
| SLA timers per complaint type and severity configured | ☐ DONE |
| Compensation accrual rules configured and approved by Finance | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 8.1.1:** Log complaint against client and unit, assigning category and severity
- [ ] **Step 8.1.2:** System auto-notifies stakeholder resolution chain

---

#### Step 8.2: Resolve and Close

**Process:** The complaint is resolved, and the client acknowledges closure.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Complaint dashboard built for CE, CSMO, and Steerco | ☐ DONE |
| Closed-loop feedback mechanism configured (client acknowledgement on closure) | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 8.2.1:** CE team monitors resolution; escalate if not resolved per SLA
- [ ] **Step 8.2.2:** Upon receiving notification of resolution, verify the fix
- [ ] **Step 8.2.3:** Click 'Close Complaint' button (auto-notifies client of resolution)
- [ ] **Step 8.2.4:** Capture client closure acknowledgement
- [ ] **Step 8.2.5:** Log root cause and preventive action

**Quality & Control Verification:**
- [ ] **Check:** Are any complaints handled outside the system?
  - ⚠️ **If NOT checked → Send notification to CE Supervisor**
- [ ] **Check:** Has the complaint breached its SLA?
  - ⚠️ **If NOT checked → Send notification for escalation to CSMO/CTO/CEO as defined**
- [ ] **Check:** Is compensation accrued correctly?
  - ⚠️ **If NOT checked → Send notification to CE Manager and Finance**

---

## Tab 09: Reports Management

**Goal:** Ensure reports are generated, distributed, and used as the single source of executive truth.

**Trigger:** Scheduled system auto-generation.

**Owner:** Client Experience Team · data stewardship via CRM Admins (Abass / Osbert)

**SLA:** Operational reports refresh within 24 hours; executive reports weekly

---

### Step-by-Step Process & Checklists

#### Step 9.1: Report Generation

**Process:** Reports are auto-generated. The CE team monitors for data anomalies.

| System Readiness (Configure Once) | Status |
|-----------------------------------|--------|
| Report catalogue defined and signed off by CE, Finance, and Executive | ☐ DONE |
| Report templates built in Microsoft CRM dashboards and/or Power BI | ☐ DONE |
| Data sources connected and refresh cadence defined | ☐ DONE |
| Scheduled distribution lists and delivery channels configured | ☐ DONE |
| Access permissions by role (CE, CSMO, Executive, Steerco) tested | ☐ DONE |
| Data quality KPIs built into each report (completeness, freshness) | ☐ DONE |

**Process Execution (Per Instance):**
- [ ] **Step 9.1.1:** Reports auto-generate and distribute on schedule
- [ ] **Step 9.1.2:** CE team reviews data for anomalies

---

#### Step 9.2: Governance and Use

**Process:** The reports are used for decision-making, and the catalogue is kept up-to-date.

**Process Execution (Per Instance):**
- [ ] **Step 9.2.1:** CE team serves ad hoc queries via self-service dashboards
- [ ] **Step 9.2.2:** Report catalogue reviewed and refreshed quarterly

**Quality & Control Verification:**
- [ ] **Check:** Is the report's data freshness and completeness validated on each refresh?
  - ⚠️ **If NOT checked → Send notification to CE Manager**
- [ ] **Check:** Is the reconciliation between Microsoft CRM, BC, and Power BI validated monthly?
  - ⚠️ **If NOT checked → Send notification to CRM Admins**
- [ ] **Check:** Are any executive decisions being taken from manually compiled Excel reports instead of the system?
  - ⚠️ **If NOT checked → Send notification to CSMO**

---

## Tab 10: Client Satisfaction Surveys

**Goal:** Measure and track client satisfaction at key touchpoints.

**⚠️ OPEN DESIGN ITEM:** Survey cadence, touchpoints, tooling (e.g., Dynamics Customer Voice), and scoring model (CSAT/NPS) to be confirmed.

**Trigger:** Key event (e.g., handover) or periodic schedule.

**Owner:** Client Experience Manager · CSMO strategic oversight

**SLA:** Touchpoint surveys within 48h of trigger event

---

### Step-by-Step Process & Checklists

#### Step 10.1: Survey Dispatch

**Process:** Surveys are automatically sent to the client. The CE team monitors response rates.

| System Readiness (To Be Configured) | Status |
|-------------------------------------|--------|
| Survey tool selected and integrated (Customer Voice, Forms Pro, or equivalent) | ☐ PENDING |
| Survey templates configured per touchpoint agreed with CSMO | ☐ PENDING |
| Cadence and trigger rules configured | ☐ PENDING |

**Process Execution (Per Instance):**
- [ ] **Step 10.1.1:** Surveys auto-dispatched per the trigger
- [ ] **Step 10.1.2:** Responses captured and scored

---

#### Step 10.2: Follow-up and Analysis

**Process:** The CE team manages follow-up on low scores and reviews aggregate metrics.

| System Readiness (To Be Configured) | Status |
|-------------------------------------|--------|
| Response capture, scoring, and routing rules configured | ☐ PENDING |
| Low-score follow-up case auto-creation rule configured | ☐ PENDING |
| CSAT/NPS dashboard built | ☐ PENDING |

**Process Execution (Per Instance):**
- [ ] **Step 10.2.1:** Low scores auto-create follow-up case with CE owner
- [ ] **Step 10.2.2:** Aggregate scores reviewed at CSMO cadence

**Quality & Control Verification:**
- [ ] **Check:** Is the response rate above the threshold?
  - ⚠️ **If NOT checked → Send notification to CE Manager**
- [ ] **Check:** Is the closed-loop follow-up rate on low scores tracked?
  - ⚠️ **If NOT checked → Send notification to CE Manager**
- [ ] **Check:** Is the CSAT/NPS trend being reviewed quarterly by the Executive?
  - ⚠️ **If NOT checked → Send notification to CSMO**

---

## Tab 11: Client Loyalty Management

**Goal:** Manage a loyalty programme to encourage retention and referrals.

**Trigger:** Handover-complete status from Stage 04 for auto-enrolment.

**Owner:** Client Experience Manager · CSMO strategic oversight

**SLA:** Enrolment within 24h of handover-complete; milestones on cadence

---

### Step-by-Step Process & Checklists

#### Step 11.1: Enrol and Manage

**Process:** The system auto-enrols the client. The CE team monitors the programme.

| System Readiness (To Be Configured) | Status |
|-------------------------------------|--------|
| Loyalty programme design approved by Executive (tiers, benefits, triggers) | ☐ PENDING |
| Loyalty entity and rules configured in Microsoft CRM | ☐ PENDING |
| Auto-enrolment rule on handover-complete configured | ☐ PENDING |
| Tier assignment and maintenance rules configured | ☐ PENDING |
| Referral tracking and reward workflow configured | ☐ PENDING |
| Milestone and anniversary touchpoint automations configured | ☐ PENDING |
| Engagement and benefit utilisation dashboard built | ☐ PENDING |

**Process Execution (Per Instance):**
- [ ] **Step 11.1.1:** Clients auto-enrolled post-handover
- [ ] **Step 11.1.2:** Tier assignments and changes maintained by system rules
- [ ] **Step 11.1.3:** Benefits redeemed via system with audit trail
- [ ] **Step 11.1.4:** Referrals tracked end-to-end and rewards issued
- [ ] **Step 11.1.5:** Milestone and anniversary touchpoints dispatched automatically

---

#### Step 11.2: Review and Optimise

**Process:** The programme's performance is reviewed.

**Process Execution (Per Instance):**
- [ ] **Step 11.2.1:** Programme engagement reporting reviewed quarterly
- [ ] **Step 11.2.2:** Programme rules reviewed annually against commercial performance

**Quality & Control Verification:**
- [ ] **Check:** Is the tier distribution consistent with the programme design?
  - ⚠️ **If NOT checked → Send notification to CE Manager**
- [ ] **Check:** Is benefit utilisation and referral conversion tracked?
  - ⚠️ **If NOT checked → Send notification to CE Manager**

---

## Cross-Cutting Dependencies

Several enabling capabilities underpin multiple stages. Failure of any of these compromises State 2 end-to-end, not only the stage in which it surfaces.

| Dependency | Description | Stages Affected |
|------------|-------------|-----------------|
| **Single Customer ID Framework** | BC Number anchored composite ID (DevelopmentID.CustomerID.UnitNumber.TransactionSequence) enforced across Microsoft CRM CE and BC | All stages |
| **Master Data Quality** | Deduplication, completeness, and integrity of customer and unit records | 01, 05, 09 |
| **Microsoft CRM CE ↔ Business Central Integration** | Financial events (mortgage disbursement, compensation accrual) must flow reliably | 05, 06, 07, 08 |
| **Document Management** | Template library, version control, archive-per-profile, e-signature or scan path | 01, 04, 06, 07 |
| **Workflow Automation** | Triggers, SLA timers, auto-notification rules | All stages |
| **Reporting and Analytics Surface** | Microsoft CRM dashboards and/or Power BI as single source of executive truth | 09 |
| **Role-based Access, Audit Logging, and Data Protection** | Cross-cutting control layer | All stages |

---

## Open Design Items

Two stages have unresolved design. These must be closed before State 2 can be declared deliverable by the vendor.

| # | Stage | What Must Be Resolved |
|---|-------|----------------------|
| **02** | **Client site visits during construction** | Scheduling surface (self-service vs. CE-mediated), virtual tour scope for diaspora clients, H&S acknowledgement workflow, and integration with Projects / Dev Delivery visibility |
| **10** | **Client satisfaction surveys** | Tool selection (Customer Voice vs. Forms Pro vs. third-party), touchpoint schedule, cadence, scoring model (CSAT vs. NPS), closed-loop follow-up rules, and survey fatigue caps |

---

## Notification Matrix

| Condition | Notification Recipient | Action Required |
|-----------|----------------------|-----------------|
| Incomplete client profile (Tab 01) | CE Supervisor | Correct data in client profile |
| SPA not archived within 48 hours (Tab 01) | CE Officer | Follow up on signed SPA |
| SPA status not updated (Tab 01) | CE Officer | Update SPA execution status |
| H&S acknowledgement missing (Tab 02) | CE Officer | Follow up with client |
| Critical/Major snags open (Tab 03) | CE Supervisor, Projects Lead | Resolve snags before handover |
| Weekly snag report not reviewed (Tab 03) | CE Manager | Review and action aged snags |
| Handover documents incomplete (Tab 04) | CE Officer | Complete documentation |
| Handover blocked by snags (Tab 04) | CE Supervisor, Projects Lead | Resolve blocking snags |
| Welcome Pack not triggered (Tab 04, 05) | CE Officer | Manually trigger or investigate |
| Aged mortgage applications (Tab 06) | CE Supervisor | Escalate and follow up |
| Payment advice routing failed (Tab 06) | CE Officer, Collections | Investigate and reroute |
| Sublease not initiated (Tab 07) | CE Supervisor, Legal | Follow up on legal process |
| Complaint handled outside system (Tab 08) | CE Supervisor | Enforce system usage |
| SLA breach for complaint (Tab 08) | CSMO/CTO/CEO | Escalate per defined path |
| Compensation accrual errors (Tab 08) | CE Manager, Finance | Investigate and correct |
| Report data quality issues (Tab 09) | CE Manager | Investigate data anomalies |
| Report reconciliation failures (Tab 09) | CRM Admins | Validate data connections |
| Excel-based decisions (Tab 09) | CSMO | Enforce system as source of truth |
| Low survey response rate (Tab 10) | CE Manager | Review survey strategy |
| Loyalty programme misalignment (Tab 11) | CE Manager | Review programme rules |

---

*End of Implementation Guide*