# Instruction Manual: 360-Degree Customer View Implementation in Dynamics 365

## Document Metadata
- **Document Version:** 1.0
- **Date:** September 02, 2026
- **Prepared For:** CRM Developer / Implementation Partner
- **Target System:** Microsoft Dynamics 365 Customer Engagement (Dataverse)
- **Purpose:** Step-by-step technical guide to build the 360-degree customer view, including the creation of all required database tables (entities), forms, workflows, and integration placeholders.

---

## Table of Contents
1. [Prerequisites & Environment Setup](#1-prerequisites--environment-setup)
2. [Phase 1: Solution Creation](#2-phase-1-solution-creation)
3. [Phase 2: Database Table (Entity) Creation](#3-phase-2-database-table-entity-creation)
4. [Phase 3: Relationships & Data Model](#4-phase-3-relationships--data-model)
5. [Phase 4: Form & View Customization](#5-phase-4-form--view-customization)
6. [Phase 5: Business Rules & Workflow Automation](#6-phase-5-business-rules--workflow-automation)
7. [Phase 6: Dashboard Construction](#7-phase-6-dashboard-construction)
8. [Phase 7: Integration Placeholders & Mock Setup](#8-phase-7-integration-placeholders--mock-setup)
9. [Phase 8: Security & Access Control](#9-phase-8-security--access-control)
10. [Phase 9: Data Migration & Testing](#10-phase-9-data-migration--testing)
11. [Appendices](#appendices)

---

## 1. Prerequisites & Environment Setup

Before beginning development, ensure the following:
- **Environment:** Access to a Dynamics 365 Developer Sandbox environment.
- **Permissions:** System Administrator or System Customizer security role.
- **Tools:** Power Apps Maker Portal (`make.powerapps.com`), XrmToolBox (optional, for bulk metadata operations), and a text editor for JSON/XML snippets.
- **Publisher:** Ensure a custom publisher (e.g., `Devtraco`, Prefix: `devtrac`) is created in the environment.

---

## 2. Phase 1: Solution Creation

1. Navigate to **Power Apps Maker Portal** > **Solutions**.
2. Click **New solution**.
3. Configure the solution:
   - **Display name:** `Devtraco 360 Customer View`
   - **Name:** `Devtraco360CustomerView` (auto-populated)
   - **Publisher:** Select `Devtraco` (Prefix: `devtrac`)
   - **Version:** `1.0.0.0`
4. Click **Create**.
5. *Note:* All subsequent components (tables, columns, forms, workflows) **must** be created within this solution to ensure manageable deployments.

---

## 3. Phase 2: Database Table (Entity) Creation

*Note: The CRM database may not currently have the custom tables listed below. The developer must create them from scratch.*

### 3.1 Extend Existing Tables
**Table: Contact**
1. Open the `Contact` table in your solution.
2. Go to **Columns** > **New column**.
3. Create the following columns:
   - `devtrac_customerid` (Single line of text, Required, Max Length: 50, Format: Text)
   - `devtrac_customertype` (Choice, Required. Options: 1=Individual, 2=Corporate, 3=Joint)
   - `devtrac_masterliststatus` (Choice, Required. Options: 1=Prospect, 2=Reservation, 3=SPA Issued, 4=SPA Executed, 5=Handover Ready, 6=Handover Complete)
   - `devtrac_taxid` (Single line of text, Optional)
   - `devtrac_dataconsent` (Two options, Required. Options: Yes/No)
   - `devtrac_communicationpreference` (Choice, Optional. Options: 1=Email, 2=Phone, 3=SMS, 4=WhatsApp, 5=Letter)
   - `devtrac_registrationdate` (Date only, Optional, Default value: Today)
   - `devtrac_sentimentscore` (Decimal, Optional, Min: 0.0, Max: 1.0) *[Placeholder for AI]*
   - `devtrac_sentiment` (Choice, Optional. Options: 1=Positive, 2=Neutral, 3=Negative) *[Placeholder for AI]*

**Table: Account**
1. Open the `Account` table.
2. Add columns: `devtrac_primarycontactid` (Lookup to Contact), `devtrac_industry` (Choice), `devtrac_companyregistration` (Single line of text), `devtrac_annualrevenue` (Currency).

### 3.2 Create New Custom Tables
For each table below, go to **Tables** > **New table** > **Advanced**. Set "Owned by" to "User or team" (unless specified otherwise). Set the Primary Column name to "Name" or "ID" as specified.

#### Table A: `devtrac_property` (Property/Unit)
- **Display Name:** Property
- **Plural Name:** Properties
- **Primary Column:** `devtrac_unitid` (Single line of text, Required, Unique)
- **Additional Columns:**
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_developmentid` (Single line of text, Required)
  - `devtrac_developmentname` (Single line of text, Required)
  - `devtrac_unitnumber` (Single line of text, Required)
  - `devtrac_unittype` (Choice: 1=Studio, 2=1BR, 3=2BR, 4=3BR, 5=Penthouse)
  - `devtrac_floor` (Whole number)
  - `devtrac_floorarea` (Decimal)
  - `devtrac_facilities` (Choices, Multi-select: 1=Swimming Pool, 2=Gym, 3=Secure Parking, 4=Garden, 5=Club House, 6=Concierge, 7=CCTV)
  - `devtrac_status` (Choice: 1=Reserved, 2=Sold, 3=Completed)
  - `devtrac_price` (Currency, Required)
  - `devtrac_completiondate` (Date only)
  - `devtrac_handoverdate` (Date only)
  - `devtrac_graceperiod` (Date only)
  - `devtrac_archived` (Two options: Yes/No)

#### Table B: `devtrac_transaction`
- **Display Name:** Transaction
- **Plural Name:** Transactions
- **Primary Column:** `devtrac_transactionid` (Single line of text, Required, Auto-number format: `TRX-{SEQNUM:6}`)
- **Additional Columns:**
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_unitid` (Lookup to `devtrac_property`, Required)
  - `devtrac_type` (Choice: 1=Deposit, 2=ConstructionPayment, 3=Mortgage, 4=Compensation)
  - `devtrac_amount` (Currency, Required, Min: 0)
  - `devtrac_paymentplan` (Multiple lines of text)
  - `devtrac_spastatus` (Choice: 1=Draft, 2=Issued, 3=Executed)
  - `devtrac_spaissuedate` (Date only)
  - `devtrac_spasigndate` (Date only)
  - `devtrac_mortgagebank` (Single line of text)
  - `devtrac_mortgageamount` (Currency)
  - `devtrac_mortgageapprovaldate` (Date only)
  - `devtrac_mortgagedisbursementdate` (Date only)
  - `devtrac_mortgagestatus` (Choice: 1=NotApplicable, 2=Submitted, 3=Approved, 4=Disbursed, 5=Denied)
  - `devtrac_receipted` (Two options: Yes/No)

#### Table C: `devtrac_interaction`
- **Display Name:** Interaction
- **Plural Name:** Interactions
- **Primary Column:** `devtrac_interactionid` (Single line of text, Auto-number: `INT-{SEQNUM:6}`)
- **Additional Columns:**
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_channel` (Choice: Email, Phone, Meeting, Chat, SMS, WhatsApp, InPerson)
  - `devtrac_type` (Choice: Inbound, Outbound, Internal)
  - `devtrac_direction` (Choice: In, Out)
  - `devtrac_subject` (Single line of text, Required)
  - `devtrac_description` (Multiple lines of text)
  - `devtrac_interactiondate` (Date and time, Required)
  - `devtrac_duration` (Whole number)
  - `devtrac_assignedto` (Lookup to User)
  - `devtrac_sentiment` (Choice: Positive, Neutral, Negative) *[Placeholder]*
  - `devtrac_sentimentscore` (Decimal, 0.0-1.0) *[Placeholder]*
  - `devtrac_followuprequired` (Two options: Yes/No)
  - `devtrac_followupdate` (Date and time)
  - `devtrac_resolved` (Two options: Yes/No)

#### Table D: `devtrac_visit`
- **Display Name:** Visit
- **Plural Name:** Visits
- **Primary Column:** `devtrac_visitid` (Single line of text, Auto-number: `VIS-{SEQNUM:6}`)
- **Additional Columns:**
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_unitid` (Lookup to `devtrac_property`, Required)
  - `devtrac_type` (Choice: SiteVisit, Inspection, Handover, PostHandover)
  - `devtrac_scheduleddate` (Date and time, Required)
  - `devtrac_actualdate` (Date and time)
  - `devtrac_status` (Choice: Scheduled, Completed, Cancelled, NoShow)
  - `devtrac_hsacknowledge` (Two options: Yes/No, Required)
  - `devtrac_feedback` (Multiple lines of text)
  - `devtrac_attendedby` (Lookup to User)
  - `devtrac_notes` (Multiple lines of text)

#### Table E: `devtrac_snag`
- **Display Name:** Snag
- **Plural Name:** Snags
- **Primary Column:** `devtrac_snagid` (Single line of text, Auto-number: `SNG-{SEQNUM:6}`)
- **Additional Columns:**
  - `devtrac_unitid` (Lookup to `devtrac_property`, Required)
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_severity` (Choice: Critical, Major, Minor, Required)
  - `devtrac_status` (Choice: Open, InProgress, Resolved, Closed, Required)
  - `devtrac_description` (Multiple lines of text, Required)
  - `devtrac_location` (Single line of text)
  - `devtrac_photourl` (URL)
  - `devtrac_reporteddate` (Date and time, Required, Default: Now)
  - `devtrac_assignedto` (Lookup to User)
  - `devtrac_resolutiondate` (Date and time)
  - `devtrac_resolutiondetails` (Multiple lines of text)
  - `devtrac_sladeadline` (Date and time)
  - `devtrac_slastatus` (Choice: OnTrack, AtRisk, Breached)
  - `devtrac_source` (Choice: InternalInspection, ClientInspection)

#### Table F: `devtrac_complaint`
- **Display Name:** Complaint
- **Plural Name:** Complaints
- **Primary Column:** `devtrac_complaintid` (Single line of text, Auto-number: `CMP-{SEQNUM:6}`)
- **Additional Columns:**
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_unitid` (Lookup to `devtrac_property`, Required)
  - `devtrac_category` (Choice: Construction, Finance, Legal, Facilities, Sales, Other)
  - `devtrac_severity` (Choice: Critical, Major, Minor)
  - `devtrac_status` (Choice: Open, InProgress, Resolved, Closed)
  - `devtrac_description` (Multiple lines of text, Required)
  - `devtrac_reporteddate` (Date and time, Required, Default: Now)
  - `devtrac_resolutiondate` (Date and time)
  - `devtrac_resolutiondetails` (Multiple lines of text)
  - `devtrac_compensationaccrued` (Currency)
  - `devtrac_rootcause` (Multiple lines of text)
  - `devtrac_preventiveaction` (Multiple lines of text)
  - `devtrac_sladeadline` (Date and time)
  - `devtrac_slastatus` (Choice: OnTrack, AtRisk, Breached)
  - `devtrac_acknowledgedbyclient` (Two options: Yes/No)

#### Table G: `devtrac_survey`
- **Display Name:** Survey
- **Plural Name:** Surveys
- **Primary Column:** `devtrac_surveyid` (Single line of text, Auto-number: `SRV-{SEQNUM:6}`)
- **Additional Columns:**
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_type` (Choice: CSAT, NPS, Onboarding, Annual)
  - `devtrac_triggerevent` (Choice: Handover, Inspection, ComplaintResolution, Periodic)
  - `devtrac_score` (Whole number, Required)
  - `devtrac_maxscore` (Whole number)
  - `devtrac_comments` (Multiple lines of text)
  - `devtrac_responses` (Multiple lines of text, Note: Store as JSON string)
  - `devtrac_surveydate` (Date and time, Required)
  - `devtrac_sentiment` (Choice: Positive, Neutral, Negative) *[Placeholder]*
  - `devtrac_sentimentscore` (Decimal, 0.0-1.0) *[Placeholder]*

#### Table H: `devtrac_loyalty`
- **Display Name:** Loyalty Profile
- **Plural Name:** Loyalty Profiles
- **Primary Column:** `devtrac_loyaltyid` (Single line of text, Auto-number: `LYL-{SEQNUM:6}`)
- **Additional Columns:**
  - `devtrac_customerid` (Lookup to Contact, Required)
  - `devtrac_tier` (Choice: Silver, Gold, Platinum)
  - `devtrac_pointsearned` (Whole number)
  - `devtrac_pointsredeemed` (Whole number)
  - `devtrac_benefitsredeemed` (Multiple lines of text, Note: Store as JSON string)
  - `devtrac_referralcount` (Whole number)
  - `devtrac_referralrewards` (Whole number)
  - `devtrac_enrollmentdate` (Date only, Required)
  - `devtrac_tiereffectivedate` (Date only)

---

## 4. Phase 3: Relationships & Data Model

Establish the following relationships within the Solution:
1. **Contact (1) : (N) devtrac_property**
   - Name: `contact_devtrac_property`
2. **Contact (1) : (N) devtrac_transaction**
   - Name: `contact_devtrac_transaction`
3. **Contact (1) : (N) devtrac_interaction**
   - Name: `contact_devtrac_interaction`
4. **Contact (1) : (N) devtrac_visit**
   - Name: `contact_devtrac_visit`
5. **Contact (1) : (N) devtrac_snag**
   - Name: `contact_devtrac_snag`
6. **Contact (1) : (N) devtrac_complaint**
   - Name: `contact_devtrac_complaint`
7. **Contact (1) : (N) devtrac_survey**
   - Name: `contact_devtrac_survey`
8. **Contact (1) : (N) devtrac_loyalty**
   - Name: `contact_devtrac_loyalty`
9. **devtrac_property (1) : (N) devtrac_transaction**
   - Name: `devtrac_property_devtrac_transaction`
10. **devtrac_property (1) : (N) devtrac_visit**
    - Name: `devtrac_property_devtrac_visit`
11. **devtrac_property (1) : (N) devtrac_snag**
    - Name: `devtrac_property_devtrac_snag`
12. **devtrac_property (1) : (N) devtrac_complaint**
    - Name: `devtrac_property_devtrac_complaint`

*Action:* For each relationship, ensure the "Delete" behavior is set to "Remove Link" (to prevent accidental deletion of parent records).

---

## 5. Phase 4: Form & View Customization

### 5.1 Contact Main Form ("360 Customer View")
1. Open the **Contact** table > **Forms** > **Main Form**.
2. Add a new Tab named **"360 Customer View"**.
3. Add Sections: "Customer Profile", "Contact Details", "Preferences & Compliance", "360 Metrics (Read-Only)".
4. Drag and drop the newly created `devtrac_*` fields into their respective sections.
5. Make `devtrac_customerid` prominent (e.g., bold label, top of section).
6. Add **Subgrids** to the form (or as separate tabs) for:
   - Properties (`devtrac_property`)
   - Transactions (`devtrac_transaction`)
   - Interactions (`devtrac_interaction`)
   - Visits (`devtrac_visit`)
   - Snags (`devtrac_snag`)
   - Complaints (`devtrac_complaint`)
   - Surveys (`devtrac_survey`)
   - Loyalty (`devtrac_loyalty`)
   *Configuration for each subgrid:* Set "Records" to "Only related records", select the respective table, and choose a default view (e.g., "Active Properties").

### 5.2 Command Bar Buttons (Contact Form)
Add the following buttons to the Contact Main Form command bar using the Ribbon Workbench or modern command designer:
- **Log Interaction:** Opens Quick Create for `devtrac_interaction`, pre-populating `devtrac_customerid`.
- **Schedule Visit:** Opens Quick Create for `devtrac_visit`, pre-populating `devtrac_customerid`.
- **Log Complaint:** Opens Quick Create for `devtrac_complaint`, pre-populating `devtrac_customerid`.
- **View Full 360:** Navigates to the "360 Customer View Dashboard" filtered by the current Contact.

### 5.3 System Views
Create the following views for each new table:
- **Contact:** "Active 360 Customers" (Columns: `devtrac_customerid`, Full Name, `devtrac_masterliststatus`, `devtrac_sentiment`, Last Activity).
- **devtrac_property:** "Client Properties" (Filtered by current Contact).
- **devtrac_transaction:** "Client Financial Summary" (Grouped by Customer).
- **devtrac_snag:** "Open Snags by Severity".
- **devtrac_complaint:** "Active Complaints".

---

## 6. Phase 5: Business Rules & Workflow Automation

Use **Power Automate** (cloud flows) for modern, scalable automation.

### 6.1 SPA Management Workflow
- **Trigger:** When a row is added or modified (`Contact` table), Condition: `devtrac_masterliststatus` equals "SPA Issued".
- **Actions:**
  1. Add a delay or use Dataverse SLA entities for a 48-hour timer.
  2. Send an email (V2) to the Contact's email address (Template: "Your SPA is ready").
  3. If status remains "SPA Issued" after 14 days, send an escalation email to the CE Supervisor.

### 6.2 Visit Scheduling Workflow
- **Trigger:** When a row is added (`devtrac_visit` table).
- **Actions:**
  1. Condition: If `devtrac_status` = "Scheduled".
  2. Send email to `devtrac_customerid` (Email) with `devtrac_scheduleddate`.
  3. Add two "Delay until" actions for T-3 days and T-1 day reminders.

### 6.3 Snag Management Workflow
- **Trigger:** When a row is added (`devtrac_snag` table).
- **Actions:**
  1. Switch/Condition on `devtrac_severity`:
     - **Critical:** Assign `devtrac_assignedto` to "Development Director" (hardcoded or via Azure AD group lookup). Set `devtrac_sladeadline` to `utcNow() + 2 days`.
     - **Major:** Assign to "Projects Lead". Set `devtrac_sladeadline` to `utcNow() + 21 days`.
     - **Minor:** Assign to "Development Team Queue". Set `devtrac_sladeadline` to `utcNow() + 7 days`.
  2. Send Teams/Email notification to the assigned user.

### 6.4 Handover Workflow
- **Trigger:** When a row is modified (`devtrac_property`), Condition: `devtrac_status` changes to "Completed".
- **Actions:**
  1. Create a new row in `devtrac_visit` (Type: Handover, Status: Scheduled).
  2. Update related `Contact`.`devtrac_masterliststatus` to "Handover Ready".
  3. *(Placeholder)* Trigger "Welcome Pack" document generation flow.

---

## 7. Phase 6: Dashboard Construction

1. Go to **Dashboards** > **New Dashboard** > **Interactive Dashboard**.
2. Name it: **"360 Customer View Dashboard"**.
3. Add the following components:
   - **Component 1: Customer Summary (List/Chart)**
     - Data Source: `Contact`
     - Columns: Photo, Full Name, `devtrac_customerid`, `devtrac_masterliststatus`, `devtrac_sentiment`.
   - **Component 2: Key Metrics (Chart)**
     - Data Source: `devtrac_property` (Count by Status) and `devtrac_complaint` (Count by Status).
   - **Component 3: Recent Activity Timeline (List)**
     - Data Source: `devtrac_interaction` and `devtrac_visit`.
     - Sort by: `devtrac_interactiondate` / `devtrac_actualdate` (Descending).
   - **Component 4: Next Best Action (List/Notes)**
     - Data Source: `devtrac_visit` (Filtered: Status = Scheduled, Date = Next 30 days).
4. Save and publish. Assign this dashboard to the "Customer Experience" app.

---

## 8. Phase 7: Integration Placeholders & Mock Setup

*Since actual integrations may not be available, create the following placeholders to ensure the data model and UI are ready for future connections.*

### 8.1 Business Central (BC) Placeholder
- **Action:** Create a custom API page definition in Dataverse (or a simple webhook endpoint mock).
- **Mock Data:** Create a Power Automate flow named "Mock BC Sync" with a manual trigger. This flow should generate 5 dummy `devtrac_transaction` records for a test contact to simulate BC pushing payment data.
- **Documentation:** Add a comment in the solution: `TODO: Replace manual trigger with HTTP Request trigger pointing to BC Webhook URL: https://placeholder-api.devtraco.local/bc/webhook`.

### 8.2 SharePoint Document Placeholder
- **Action:** Enable Server-Based SharePoint Integration in Dynamics 365 Settings.
- **Setup:** Create a dummy Document Location record on a test Contact.
- **Mock Flow:** Create a Power Automate flow: "When a file is created in SharePoint (Mock)" -> "Add a new row to a Dataverse table". Point it to a test SharePoint site: `https://devtraco.sharepoint.com/sites/PlaceholderClientDocs`.

### 8.3 ELAN / Fabrico (Facilities & Construction) Placeholders
- **Action:** Create two new empty tables: `devtrac_elan_servicerequest` and `devtrac_fabrico_unitstatus`.
- **Purpose:** These tables act as the "landing zone" for future API payloads.
- **Fields:** Add basic fields (`devtrac_externalid`, `devtrac_customerid`, `devtrac_payloadjson` (Multiple lines of text)).
- **Documentation:** Tag these tables with "INTEGRATION_PLACEHOLDER" in the description.

### 8.4 AI Sentiment Placeholder
- **Action:** For fields `devtrac_sentiment` and `devtrac_sentimentscore`, create a Power Automate flow that currently sets a *default mock value* (e.g., Sentiment = "Neutral", Score = "0.5") on record creation.
- **Documentation:** Add a comment: `TODO: Integrate Azure AI Language Service (Sentiment Analysis) here in Phase 2`.

---

## 9. Phase 8: Security & Access Control

1. Go to **Settings** > **Security** > **Security Roles**.
2. Clone the "Salesperson" role and name it **"Devtraco CE Officer"**.
3. Customize privileges:
   - **Contact, Account:** Read, Write, Create, Append, Append To (User level).
   - **devtrac_property, devtrac_transaction, devtrac_interaction, devtrac_visit, devtrac_snag, devtrac_complaint, devtrac_survey, devtrac_loyalty:** Read, Write, Create, Append, Append To (User level).
4. Create **"Devtraco CE Manager"** role: Same as above, but with "Organization" level Read access for reporting.
5. **Field-Level Security (FLS):**
   - Enable FLS on: `devtrac_taxid`, `devtrac_compensationaccrued`, `devtrac_mortgageamount`.
   - Create a Field Security Profile named "Financial & PII Access".
   - Grant "Read" and "Update" permissions to this profile.
   - Assign this profile only to the "Devtraco CE Manager" and "Finance Team" security roles.

---

## 10. Phase 9: Data Migration & Testing

### 10.1 Mock Data Generation (For Testing)
Since the database is new, the developer must populate it for UAT:
1. Create 5 test **Contacts** with varying `devtrac_masterliststatus` values.
2. For each Contact, create:
   - 1-2 **Properties**.
   - 2-3 **Transactions**.
   - 3 **Interactions**.
   - 1 **Visit** (Scheduled).
   - 1 **Snag** (Open, Major).
   - 1 **Complaint** (Resolved).
   - 1 **Survey** (Score: 8/10).
   - 1 **Loyalty Profile** (Tier: Silver).

### 10.2 Testing Checklist (Developer QA)
- [ ] Can a new Contact be created and auto-assigned a `devtrac_customerid`? *(Note: If auto-numbering is needed, configure an Auto-Number rule or Power Automate for `devtrac_customerid`)*.
- [ ] Do subgrids on the Contact form correctly filter to show only related records?
- [ ] Does the "SPA Issued" workflow trigger and create the correct tasks/emails?
- [ ] Does the Snag workflow correctly assign based on severity?
- [ ] Are FLS fields hidden from a user with the basic "CE Officer" role?
- [ ] Does the Interactive Dashboard load in under 3 seconds with the mock data?

### 10.3 UAT Handover
1. Publish all customizations.
2. Export the `Devtraco360CustomerView` solution as **Unmanaged** for the UAT environment.
3. Provide the business team with the "Test Credentials" and the "UAT Checklist" (from the original spec document).

---

## Appendices

### Appendix A: Auto-Numbering Configuration (If applicable)
If native auto-numbering is not used for `devtrac_customerid`, create a Power Automate flow:
- **Trigger:** When a row is added (Contact).
- **Condition:** `devtrac_customerid` is empty.
- **Action:** Generate a random/sequential string (e.g., `DEV-CUS-` + `rand(10000, 99999)`). *Note: For true sequential numbering, use a Dataverse Auto-Number column type or a custom counter table.*

### Appendix B: Troubleshooting Common Issues
- **Subgrids not showing data:** Verify the Lookup field on the child record is correctly populated with the parent Contact's GUID. Check view filters.
- **Workflow not triggering:** Ensure the flow is turned "On". Check the "Run History" in Power Automate for failed conditions (e.g., null values in trigger fields).
- **Field-Level Security not hiding data:** Ensure the user is *not* a member of the Field Security Profile, and that the "Read" permission for that profile is explicitly not granted to their base role.

### Appendix C: Deployment to Production
1. In the Sandbox environment, go to **Solutions** > `Devtraco360CustomerView`.
2. Click **Export**.
3. Select **Managed** (recommended for production) or **Unmanaged** (if further dev is needed in Prod).
4. In the Production environment, go to **Solutions** > **Import**.
5. Upload the `.zip` file, map any missing connections (e.g., SharePoint site URL, Email accounts), and click **Import**.
6. After import, manually assign Security Roles and Field Security Profiles to production users.

---
*End of Instruction Manual*