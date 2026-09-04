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
16. [Cross-Departmental Interactions](#cross-departmental-interactions)

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

**Cross-Departmental Interaction:**
- **Sales:** Verify unit allocation and pricing against reservation record
- **Finance:** Confirm payment terms are accurate

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

**Cross-Departmental Interaction:**
- **Sales:** Auto-cc'd on SPA dispatch for visibility and client relationship continuity
- **Technology:** Ensure SPA template merge fields and auto-dispatch workflow function correctly

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

**Cross-Departmental Interaction:**
- **Technology:** Ensure document archive and status update workflows function correctly
- **Sales:** Update sales records of SPA completion

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

**Cross-Departmental Interaction:**
- **Fabrico (Construction):** Coordinate site access and safety protocols
- **Projects / Dev Delivery:** Confirm site readiness and availability of construction team

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

**Cross-Departmental Interaction:**
- **Fabrico (Construction):** Provide construction progress insights for client communication
- **Projects / Dev Delivery:** Share project milestone updates for proactive client communication

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

**Cross-Departmental Interaction:**
- **Fabrico (Construction):** Report snags and coordinate fixes
- **Development Team:** Auto-assign snags for resolution; provide technical guidance
- **Projects:** Monitor resolution progress and resource allocation

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

**Cross-Departmental Interaction:**
- **Fabrico (Construction):** Verify completion of physical fixes
- **Development Team:** Provide resolution status updates
- **Executive Management:** Weekly aged snag report to CSMO and Development Director

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

**Cross-Departmental Interaction:**
- **Development Team:** Confirm "cleaned & ready" status
- **Fabrico (Construction):** Ensure final cleaning and preparation complete
- **Projects:** Coordinate final inspection logistics

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

**Cross-Departmental Interaction:**
- **Collections:** Auto-notified of handover completion to manage financial follow-ups
- **ELAN (Facilities Management):** Initiate property handover and ongoing management
- **Sales:** Update sales records of successful handover
- **Executive Management:** Track handover completion metrics

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

**Cross-Departmental Interaction:**
- **ELAN (Facilities Management):** Receive client information and property details for ongoing management
- **Property Managers:** Copied on Welcome Pack for visibility and client relationship continuity
- **Sales:** Copied on Welcome Pack for client relationship continuity
- **Executive Management:** Track Welcome Pack dispatch completion

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

**Cross-Departmental Interaction:**
- **Sales:** Coordinate on client financial readiness
- **Finance:** Monitor mortgage pipeline and financial implications
- **Technology:** Ensure T-6 month alert system functions correctly

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

**Cross-Departmental Interaction:**
- **Finance / Collections:** Receive payment advice and reconcile funds
- **Executive Management:** Weekly mortgage pipeline report reviewed by CE and Finance
- **Development Team:** Confirm property completion timeline for mortgage scheduling

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

**Cross-Departmental Interaction:**
- **Legal:** Draft and finalize sublease and ancillary agreements
- **Sales:** Coordinate on client details and agreement terms
- **Technology:** Ensure auto-reporting and document generation workflows function correctly

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

**Cross-Departmental Interaction:**
- **Legal:** Manage Lands Commission submission and registration process
- **Executive Management:** Track submission status and milestone alerts
- **Technology:** Ensure milestone tracking and alert system functions correctly

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

**Cross-Departmental Interaction:**
- **All Departments:** System auto-notifies relevant stakeholders based on complaint category
- **Legal:** Notified on serious complaints requiring legal review
- **Development Team:** Notified on construction-related complaints
- **Executive Management:** Escalation path defined for unresolved complaints

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

**Cross-Departmental Interaction:**
- **Finance:** Process compensation accruals where policy triggered
- **Development Team:** Resolve construction-related complaints and provide root cause analysis
- **ELAN (Facilities Management):** Resolve property management-related complaints
- **Executive Management:** Review weekly complaint dashboard by CSMO

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

**Cross-Departmental Interaction:**
- **Technology (IT):** Maintain CRM and Power BI report generation
- **Finance:** Review financial reports for accuracy
- **Executive Management:** Review executive reports weekly
- **Steerco:** Review reports for conformance oversight

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

**Cross-Departmental Interaction:**
- **Technology (IT):** Validate data integration and reconciliation between systems
- **All Departments:** Use reports for operational and strategic decision-making

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

**Cross-Departmental Interaction:**
- **Technology (IT):** Integrate survey tool with CRM
- **Executive Management:** Strategic oversight by CSMO on survey design and analysis

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

**Cross-Departmental Interaction:**
- **Executive Management:** Review CSAT/NPS trends quarterly
- **All Departments:** Use survey insights to improve processes and service delivery

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

**Cross-Departmental Interaction:**
- **Sales:** Track and reward client referrals
- **Executive Management:** Strategic oversight by CSMO on programme performance
- **Technology (IT):** Ensure loyalty system rules and workflows function correctly

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

**Cross-Departmental Interaction:**
- **Executive Management:** Review programme engagement reporting quarterly
- **Finance:** Assess commercial performance of loyalty programme
- **Sales:** Provide feedback on referral programme effectiveness

---

## Cross-Cutting Dependencies

Several enabling capabilities underpin multiple stages. Failure of any of these compromises State 2 end-to-end, not only the stage in which it surfaces.

| Dependency | Description | Stages Affected | Primary Department |
|------------|-------------|-----------------|-------------------|
| **Single Customer ID Framework** | BC Number anchored composite ID (DevelopmentID.CustomerID.UnitNumber.TransactionSequence) enforced across Microsoft CRM CE and BC | All stages | Technology / IT |
| **Master Data Quality** | Deduplication, completeness, and integrity of customer and unit records | 01, 05, 09 | Technology / IT |
| **Microsoft CRM CE ↔ Business Central Integration** | Financial events (mortgage disbursement, compensation accrual) must flow reliably | 05, 06, 07, 08 | Technology / IT & Finance |
| **Document Management** | Template library, version control, archive-per-profile, e-signature or scan path | 01, 04, 06, 07 | Technology / IT |
| **Workflow Automation** | Triggers, SLA timers, auto-notification rules | All stages | Technology / IT |
| **Reporting and Analytics Surface** | Microsoft CRM dashboards and/or Power BI as single source of executive truth | 09 | Technology / IT |
| **Role-based Access, Audit Logging, and Data Protection** | Cross-cutting control layer | All stages | Technology / IT & Compliance |

---

## Open Design Items

Two stages have unresolved design. These must be closed before State 2 can be declared deliverable by the vendor.

| # | Stage | What Must Be Resolved | Primary Department |
|---|-------|----------------------|-------------------|
| **02** | **Client site visits during construction** | Scheduling surface (self-service vs. CE-mediated), virtual tour scope for diaspora clients, H&S acknowledgement workflow, and integration with Projects / Dev Delivery visibility | Projects / Dev Delivery & Technology |
| **10** | **Client satisfaction surveys** | Tool selection (Customer Voice vs. Forms Pro vs. third-party), touchpoint schedule, cadence, scoring model (CSAT vs. NPS), closed-loop follow-up rules, and survey fatigue caps | Technology & Executive Management |

---

## Notification Matrix

| Condition | Notification Recipient | Action Required | Department Lead |
|-----------|----------------------|-----------------|-----------------|
| Incomplete client profile (Tab 01) | CE Supervisor | Correct data in client profile | CX Team |
| SPA not archived within 48 hours (Tab 01) | CE Officer | Follow up on signed SPA | CX Team |
| SPA status not updated (Tab 01) | CE Officer | Update SPA execution status | CX Team |
| H&S acknowledgement missing (Tab 02) | CE Officer | Follow up with client | CX Team |
| Critical/Major snags open (Tab 03) | CE Supervisor, Projects Lead | Resolve snags before handover | Development / Fabrico |
| Weekly snag report not reviewed (Tab 03) | CE Manager | Review and action aged snags | CX Team |
| Handover documents incomplete (Tab 04) | CE Officer | Complete documentation | CX Team |
| Handover blocked by snags (Tab 04) | CE Supervisor, Projects Lead | Resolve blocking snags | Development / Fabrico |
| Welcome Pack not triggered (Tab 04, 05) | CE Officer | Manually trigger or investigate | CX Team / ELAN |
| Aged mortgage applications (Tab 06) | CE Supervisor | Escalate and follow up | CX Team / Finance |
| Payment advice routing failed (Tab 06) | CE Officer, Collections | Investigate and reroute | Finance / Collections |
| Sublease not initiated (Tab 07) | CE Supervisor, Legal | Follow up on legal process | Legal |
| Complaint handled outside system (Tab 08) | CE Supervisor | Enforce system usage | CX Team |
| SLA breach for complaint (Tab 08) | CSMO/CTO/CEO | Escalate per defined path | Executive Management |
| Compensation accrual errors (Tab 08) | CE Manager, Finance | Investigate and correct | Finance |
| Report data quality issues (Tab 09) | CE Manager | Investigate data anomalies | CX Team |
| Report reconciliation failures (Tab 09) | CRM Admins | Validate data connections | Technology / IT |
| Excel-based decisions (Tab 09) | CSMO | Enforce system as source of truth | Executive Management |
| Low survey response rate (Tab 10) | CE Manager | Review survey strategy | CX Team |
| Loyalty programme misalignment (Tab 11) | CE Manager | Review programme rules | CX Team / Executive |

---

## Cross-Departmental Interactions

This section details the ongoing interactions between the Client Experience (CX) team and other departments within Devtraco Group. These partnerships are essential for delivering an exceptional customer experience.

### Executive Management

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Strategic Reporting | Weekly | Executive reports on SPA status, handovers, complaints, and client satisfaction |
| Escalation Management | As needed | Escalation of SLA breaches, critical complaints, and compensation issues |
| Programme Oversight | Quarterly | Review of loyalty programme performance and client satisfaction trends |

**Key Contact:** CSMO (Chief Sales & Marketing Officer), SteerCo

---

### Technology (IT / Dynamics Team)

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| System Readiness | Ongoing | Ensure CRM, Business Central, and Power BI are operational and integrated |
| Workflow Automation | As needed | Configure and troubleshoot triggers, SLA timers, and auto-notifications |
| Data Integrity | Monthly | Validate reconciliation between systems; enforce Single Customer ID framework |
| User Access | As needed | Manage role-based access and permissions for CX team |

**Key Contact:** CRM Admins (Abass / Osbert), IT Department

---

### Sales Department

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Client Handoff | Per client | Transfer client details from sales to CX post-reservation |
| SPA Coordination | Per client | Auto-cc Sales on SPA dispatch; update on SPA execution status |
| Referral Tracking | Ongoing | Track client referrals and reward issuance through loyalty programme |
| Compensation Events | As needed | Notify Head of Sales on compensation triggers for clients |

**Key Contact:** Head of Sales, Sales Consultants

---

### Development Team

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Project Milestones | As needed | Receive updates on project completion status |
| Snag Management | Daily | Auto-assign and track resolution of snags raised during inspections |
| Handover Readiness | Per unit | Confirm "cleaned & ready" status for unit handover |
| Quality Feedback | Monthly | Feed repeat snag analysis into development quality loop |

**Key Contact:** Development Director, Projects Lead

---

### Fabrico (Construction)

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Site Visits | Per request | Coordinate and schedule client site visits during construction |
| Snag Resolution | Per snag | Execute physical fixes for snags identified during inspections |
| Unit Readiness | Per unit | Prepare unit for handover and final inspection |
| Construction Progress | As needed | Provide updates for client communication and site visit preparation |

**Key Contact:** Construction Manager, Site Supervisors

---

### ELAN (Facilities Management)

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Client Handoff | Post-handover | Copy Property Managers on Welcome Pack for ongoing client management |
| Client Service | Ongoing | Coordinate on property management-related client requests and complaints |
| Quality Feedback | Monthly | Feed facility-related feedback into service improvement cycles |
| Amenity Management | Ongoing | Coordinate on amenity-related client communication and events |

**Key Contact:** Property Managers, Facilities Management Team

---

### Finance / Collections

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Mortgage Follow-up | As needed | Ensure timely mortgage disbursement and reconciliation |
| Compensation Accrual | Per complaint | Process compensation accruals for complaints as per policy |
| Payment Advice | Per mortgage | Route payment advice to Collections; reconcile funds |
| Financial Reporting | Weekly | Review weekly mortgage pipeline and aged application reports |

**Key Contact:** Finance Director, Collections Team

---

### Legal

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Sublease Preparation | Per handover | Draft and finalize sublease, ancillary, and consent agreements |
| Lands Commission | Per submission | Submit and track agreements at Lands Commission |
| Complaint Support | As needed | Provide legal guidance on serious complaints and disputes |
| Documentation Review | As needed | Review document templates and client details for legal compliance |

**Key Contact:** Legal Department

---

### SteerCo (Governance & Oversight)

| Interaction Type | Frequency | Key Activities |
|------------------|-----------|----------------|
| Conformance Oversight | Periodic | Review reports to ensure CX workflow conforms to defined processes |
| Performance Review | Quarterly | Review KPIs, complaint trends, and client satisfaction metrics |
| Governance Advisory | As needed | Provide strategic guidance on vendor governance and programme oversight |

**Key Contact:** SteerCo (Vendor Governance, GEMS Programme)

---

*End of Implementation Guide*