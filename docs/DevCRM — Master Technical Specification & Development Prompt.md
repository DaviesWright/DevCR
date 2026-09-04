# DevCRM — Master Technical Specification & Development Prompt
## Next.js + Prisma CRM, Marketing Automation, Omnichannel Engagement & Revenue Platform

**Document Type:** Master Development Specification  
**Product:** DevCRM  
**Architecture:** Next.js + Prisma  
**Purpose:** Establish the technical architecture, data model, automation framework, marketing engine, omnichannel integration layer and extensibility requirements for the next generation of DevCRM.

---

# 1. DEVELOPMENT MANDATE

You are the senior engineering team responsible for designing and building **DevCRM**, a modern CRM and revenue-management platform using **Next.js + Prisma**.

DevCRM must not be designed as a conventional contact-management CRM with marketing features added later.

The architecture must support:

> **Lead Generation → Lead Capture → Enrichment → Segmentation → Scoring → Nurturing → Qualification → Sales Handoff → Opportunity → Customer → Retention → Upsell/Cross-sell → Revenue Attribution**

The system must also support:

> **Email + SMS + WhatsApp + Phone + Web + Forms + Chat + Social/Ad integrations + future channels**

The development team must therefore design the platform around a **central CRM data model + event engine + automation engine + omnichannel integration layer**.

Do not create isolated features that cannot participate in workflows.

Every significant CRM, marketing or customer interaction should be capable of becoming an **event** that can trigger automation.

---

# 2. CORE PRODUCT PRINCIPLE

DevCRM should combine the strongest concepts from leading platforms such as:

- HubSpot
- ActiveCampaign
- Salesforce
- Microsoft Dynamics 365
- Zoho CRM
- Nutshell

The objective is NOT to clone any one platform.

Instead, build a unified architecture combining:

### CRM

- Leads
- Contacts
- Accounts
- Opportunities
- Activities
- Tasks
- Meetings
- Calls
- Notes
- Pipelines
- Products
- Quotes
- Orders
- Customers

### Marketing

- Campaigns
- Audiences
- Segments
- Forms
- Landing pages
- Email campaigns
- SMS
- WhatsApp
- Drip campaigns
- Nurture programs
- Lead scoring
- Attribution
- Marketing analytics

### Automation

- Trigger engine
- Rules engine
- Workflow builder
- Journey builder
- Branching
- Conditions
- Wait/delay
- Goals
- Actions
- Notifications
- Sales automation
- Lead routing

### Intelligence

- Behaviour scoring
- Intent scoring
- Predictive scoring
- AI recommendations
- Next-best-action
- Lead classification
- Conversation summarisation
- Campaign optimisation

---

# 3. ARCHITECTURAL PRINCIPLE

The platform should follow this conceptual architecture:

```text
                         DEVCRM
                           |
        +------------------+------------------+
        |                  |                  |
       CRM             MARKETING          ENGAGEMENT
        |                  |                  |
 Leads / Contacts      Campaigns          Email
 Accounts             Segments           SMS
 Opportunities        Journeys           WhatsApp
 Activities            Drips              Phone
 Tasks                 Forms              Chat
        |                  |                  |
        +------------------+------------------+
                           |
                     EVENT ENGINE
                           |
                    AUTOMATION ENGINE
                           |
        +------------------+------------------+
        |                  |                  |
       RULES             ACTIONS           AI/SCORING
        |                  |                  |
        +------------------+------------------+
                           |
                     DATA / ANALYTICS
                           |
                 Revenue & Attribution
```

The event and automation layers are foundational.

---

# 4. TECHNOLOGY STACK

The initial platform should use:

### Frontend / Application

- Next.js
- TypeScript
- React
- Server Components where appropriate
- Client Components where interactive behaviour is required
- Responsive UI
- Component-based architecture

### Backend

- Next.js server-side architecture
- API routes / route handlers
- Server Actions where appropriate
- Background job architecture for asynchronous operations

### ORM

- Prisma

### Database

The database layer must be designed so that the application can operate against the selected relational database without coupling business logic directly to database-specific implementation.

The existing CRM data model and existing SQL Server data must be considered when implementing the migration/integration layer.

### Supporting infrastructure

Provide architectural provision for:

- Redis/cache
- Background workers
- Job queues
- Scheduled jobs
- Webhooks
- Event processing
- File/object storage
- Email provider
- SMS provider
- WhatsApp provider
- AI services
- Analytics
- Logging
- Monitoring

These do not all have to be implemented immediately, but the architecture must not prevent them from being added.

---

# 5. EXISTING CRM DATA MUST REMAIN CENTRAL

DevCRM already contains core CRM concepts including:

- Leads
- Opportunities
- Orders
- Customers
- Owners
- Lead Sources
- Development/Product Interest
- Status
- Contact information
- Marketing ownership
- Activities

Do not duplicate core CRM entities simply because marketing functionality is being introduced.

Marketing automation must operate against the existing CRM entities.

For example:

```text
Lead
   ↓
Campaign Member
   ↓
Segment
   ↓
Workflow
   ↓
Activity
   ↓
Lead Score
   ↓
Qualification
   ↓
Opportunity
```

---

# 6. REQUIRED NEW DATA MODEL

Extend the Prisma schema with appropriate tables/models.

The exact implementation may differ, but the following entities must be accommodated.

---

## 6.1 MARKETING

### Campaign

Fields should include:

- id
- name
- description
- campaignType
- objective
- status
- ownerId
- budget
- startDate
- endDate
- targetAudience
- productId where applicable
- createdAt
- updatedAt

### CampaignMember

Track:

- campaignId
- leadId
- contactId
- status
- source
- joinedAt
- respondedAt
- convertedAt
- revenue
- attributionWeight

### CampaignChannel

Allow campaigns to use:

- email
- SMS
- WhatsApp
- phone
- web
- social
- advertising
- events
- chatbot
- other future channels

### CampaignEvent

Track campaign interactions:

- delivered
- opened
- clicked
- replied
- bounced
- unsubscribed
- converted
- meeting booked
- opportunity created
- opportunity won

---

# 7. AUDIENCE & SEGMENTATION

Create a flexible segmentation system.

### Segment

Support:

- static segments
- dynamic segments
- rule-based segments
- behavioural segments
- lifecycle segments
- campaign segments

Example:

```text
Segment:
"High Value Property Prospects"

Conditions:

Interested Development = Premium Property
AND
Lead Score > 70
AND
Country = Ghana
AND
Last Activity < 30 days
```

Segments must be reusable across:

- campaigns
- workflows
- email
- SMS
- WhatsApp
- reporting
- lead routing

---

# 8. LEAD SCORING

Create a dedicated scoring architecture.

Do not hard-code one score field and assume this is sufficient.

Support:

### Fit Score

Examples:

- Industry
- Company size
- Location
- Job title
- Revenue
- Product interest

### Engagement Score

Examples:

- Email open
- Email click
- Website visit
- Form submission
- Content download
- Webinar attendance
- WhatsApp interaction

### Intent Score

Examples:

- Pricing page visit
- Demo request
- Contact sales
- Quote request
- Repeat high-value page visits

### Recency Score

### Frequency Score

### Overall Score

Conceptually:

```text
Overall Lead Score =
Fit Score
+ Engagement Score
+ Intent Score
+ Recency Score
+ Frequency Score
```

Create provision for configurable scoring rules.

The scoring system must generate events when scores cross configurable thresholds.

Example:

```text
Lead Score = 70
        ↓
MQL threshold reached
        ↓
Create Sales Task
        ↓
Notify Owner
        ↓
Move Lead to MQL
        ↓
Start Sales Handoff Workflow
```

---

# 9. EVENT ENGINE

This is a critical component.

Create a central event model / event architecture.

Potential entity:

### CustomerEvent

Fields should accommodate:

- id
- eventType
- entityType
- entityId
- actorId
- source
- metadata
- occurredAt
- processedAt
- correlationId

Examples:

```text
LEAD_CREATED
LEAD_UPDATED
LEAD_ASSIGNED
LEAD_QUALIFIED
LEAD_DISQUALIFIED
LEAD_CONVERTED

EMAIL_SENT
EMAIL_DELIVERED
EMAIL_OPENED
EMAIL_CLICKED
EMAIL_BOUNCED

SMS_SENT
SMS_DELIVERED
SMS_FAILED

WHATSAPP_SENT
WHATSAPP_DELIVERED
WHATSAPP_READ
WHATSAPP_REPLIED

FORM_SUBMITTED
WEBSITE_VISITED
PAGE_VIEWED
DOCUMENT_DOWNLOADED

MEETING_BOOKED
MEETING_COMPLETED
MEETING_MISSED

OPPORTUNITY_CREATED
OPPORTUNITY_STAGE_CHANGED
OPPORTUNITY_WON
OPPORTUNITY_LOST

LEAD_SCORE_CHANGED
SEGMENT_ENTERED
SEGMENT_EXITED
CAMPAIGN_JOINED
CAMPAIGN_CONVERTED
```

The event system must be extensible.

Do not hard-code events only into individual screens.

---

# 10. AUTOMATION ENGINE

Build a reusable automation engine.

Every workflow should contain:

```text
TRIGGER
   ↓
CONDITIONS
   ↓
ACTIONS
   ↓
WAIT
   ↓
CONDITIONS
   ↓
BRANCH
   ↓
ACTIONS
```

The automation engine must support:

### Triggers

- Lead created
- Contact created
- Lead updated
- Status changed
- Owner changed
- Lead score changed
- Segment entered
- Segment exited
- Campaign joined
- Form submitted
- Email opened
- Email clicked
- Website visited
- Page visited
- WhatsApp message received
- SMS response
- Meeting booked
- Opportunity created
- Opportunity stage changed
- Deal won
- Deal lost
- Date/time
- Relative date
- Scheduled event
- External webhook

---

# 11. AUTOMATION CONDITIONS

Support conditions such as:

- equals
- not equals
- contains
- does not contain
- greater than
- less than
- greater than/equal
- less than/equal
- is empty
- is not empty
- exists
- does not exist
- date comparison
- time since event
- count of events
- score threshold
- segment membership

Support nested AND/OR logic.

Example:

```text
Lead Score > 70
AND
Country = Ghana
AND
Interested Development contains "Residential"
```

---

# 12. AUTOMATION ACTIONS

### CRM Actions

- Create lead
- Update lead
- Create contact
- Update contact
- Create opportunity
- Update opportunity
- Change pipeline
- Change stage
- Assign owner
- Reassign owner
- Create task
- Create call
- Schedule meeting
- Add note
- Add tag
- Remove tag

### Sales Actions

- Qualify
- Disqualify
- Convert Lead
- Notify sales representative
- Notify manager
- Escalate
- Create follow-up task

### Marketing Actions

- Add campaign
- Remove campaign
- Add segment
- Remove segment
- Start journey
- Stop journey
- Send email
- Send SMS
- Send WhatsApp

### AI Actions

Provision for:

- Calculate lead score
- Classify lead
- Summarise conversation
- Recommend next action
- Generate email
- Detect intent
- Predict conversion probability

---

# 13. VISUAL WORKFLOW BUILDER

Build the system so a future visual workflow designer can represent:

```text
[TRIGGER]
    |
[CONDITION]
    |
 +--+--+
 |     |
YES    NO
 |     |
EMAIL  SMS
 |
WAIT 2 DAYS
 |
CHECK EMAIL OPEN
 |
 +----+----+
 |         |
YES       NO
 |         |
TASK      EMAIL
 |
SALES
```

Workflow nodes should be data-driven.

Do not hard-code workflow logic into individual pages.

Each workflow should have:

- name
- description
- status
- trigger
- nodes
- conditions
- actions
- version
- owner
- execution rules
- entry criteria
- exit criteria
- re-entry rules
- createdAt
- updatedAt

---

# 14. WORKFLOW EXECUTION

Create a workflow execution model.

Potential tables:

### Workflow

### WorkflowVersion

### WorkflowNode

### WorkflowExecution

### WorkflowExecutionStep

### WorkflowError

Track:

- started
- waiting
- completed
- failed
- cancelled
- skipped

This is required for debugging and auditability.

---

# 15. DRIP CAMPAIGNS

Drip campaigns must be implemented as a specialised workflow type.

Example:

```text
Lead joins campaign
       ↓
Send Email 1
       ↓
Wait 2 days
       ↓
Did they open?
   /        \
 YES        NO
 |           |
Email 2     Email 1B
 |
Wait 3 days
 |
Did they visit pricing?
   /        \
 YES        NO
 |           |
Sales Task  Email 3
```

Support:

- fixed delays
- business-day delays
- specific dates
- time-of-day sending
- behavioural branching
- goals
- exits
- frequency limits
- unsubscribe rules
- re-entry rules

---

# 16. NURTURE PROGRAMS

Create nurture journeys based on:

- lifecycle stage
- product interest
- persona
- geography
- lead score
- engagement
- customer status

Example:

```text
NEW LEAD
   ↓
EDUCATION
   ↓
ENGAGEMENT
   ↓
MQL
   ↓
SALES NURTURE
   ↓
SQL
   ↓
OPPORTUNITY
```

A lead should automatically exit marketing nurture when appropriate.

---

# 17. OMNICHANNEL ARCHITECTURE

This is a mandatory architectural requirement.

Do not build WhatsApp, SMS and email as completely independent systems.

Create a common:

> **Engagement / Communication Abstraction Layer**

Conceptually:

```text
                 DEVCRM
                    |
          ENGAGEMENT SERVICE
                    |
       +------------+------------+
       |            |            |
     EMAIL         SMS       WHATSAPP
       |            |            |
 Provider A     Provider B   Provider C
```

The CRM should not depend directly on a single provider.

---

# 18. OMNICHANNEL PROVIDER ADAPTERS

Create provider interfaces such as:

```text
EmailProvider
SmsProvider
WhatsAppProvider
VoiceProvider
ChatProvider
```

Each provider should implement common functions such as:

```text
send()
schedule()
cancel()
getStatus()
handleWebhook()
validateRecipient()
```

This allows providers to be changed without rewriting the CRM.

---

# 19. EMAIL INTEGRATION

Provide architecture for:

- transactional email
- marketing email
- automated email
- bulk email
- scheduled email
- personalised email
- template management
- HTML email
- attachments
- tracking
- bounce processing
- unsubscribe
- suppression lists

Provider abstraction should allow future integration with services such as:

- SendGrid
- Amazon SES
- Mailgun
- Resend
- Microsoft Graph
- other SMTP/API providers

Do not hard-code one vendor into the business logic.

---

# 20. SMS INTEGRATION

Provide an SMS abstraction layer supporting:

- outbound SMS
- delivery status
- inbound SMS
- replies
- opt-out
- sender ID
- templates
- scheduled SMS

Design for multiple providers.

For Ghana/Africa deployments, provider configuration must be replaceable because local carrier/provider availability may differ.

---

# 21. WHATSAPP INTEGRATION

WhatsApp must be treated as a major channel.

Architect for:

- WhatsApp Business API
- inbound messages
- outbound messages
- message templates
- media
- delivery status
- read status
- replies
- conversation sessions
- contact matching
- webhook processing
- opt-in/consent
- template approval status

Create a provider abstraction so the system can support:

- Meta WhatsApp Business Platform
- approved Business Solution Providers
- future providers

WhatsApp conversations must be linked to:

```text
Contact
Lead
Account
Opportunity
Campaign
Conversation
Activity
```

---

# 22. CONVERSATION MODEL

Create a generic conversation structure.

Potential tables:

### Conversation

- id
- channel
- contactId
- leadId
- accountId
- assignedUserId
- status
- startedAt
- lastMessageAt
- closedAt

### ConversationParticipant

### ConversationMessage

Track:

- inbound/outbound
- sender
- recipient
- channel
- messageType
- text
- media
- providerMessageId
- status
- deliveredAt
- readAt
- failedAt
- metadata

This allows WhatsApp, SMS, chat and potentially other channels to use the same conversation architecture.

---

# 23. CHANNEL PREFERENCES & CONSENT

Create explicit customer communication preferences.

Potential model:

### CommunicationPreference

Track:

- email opt-in
- SMS opt-in
- WhatsApp opt-in
- phone consent
- marketing consent
- transactional consent
- source
- consent timestamp
- withdrawal timestamp

Never assume consent simply because contact information exists.

Automation must check communication preferences before sending marketing messages.

---

# 24. MESSAGE TEMPLATES

Create:

### MessageTemplate

Support:

- email
- SMS
- WhatsApp
- future channels

Fields should include:

- name
- channel
- subject
- body
- variables
- language
- status
- version
- approval status
- provider template ID
- createdBy
- updatedBy

Support personalisation:

```text
{{firstName}}
{{lastName}}
{{company}}
{{leadOwner}}
{{product}}
{{opportunityValue}}
```

---

# 25. FORMS & LEAD CAPTURE

Build architecture for:

- web forms
- landing-page forms
- embedded forms
- popup forms
- event forms
- enquiry forms
- contact forms
- application forms

Form submission should generate:

```text
FORM_SUBMITTED
```

which can trigger:

- lead creation
- duplicate check
- lead update
- score update
- campaign membership
- email
- WhatsApp
- task
- owner assignment

---

# 26. WEBSITE & BEHAVIOURAL TRACKING

Create provision for a future DevCRM tracking script.

Potential events:

```text
PAGE_VIEW
SESSION_STARTED
FORM_SUBMITTED
BUTTON_CLICKED
DOCUMENT_DOWNLOADED
VIDEO_VIEWED
PRICING_PAGE_VIEWED
PRODUCT_PAGE_VIEWED
```

The architecture should allow anonymous visitors to later be associated with known leads/contacts.

Do not expose personally identifiable information unnecessarily in browser tracking.

---

# 27. SALES AUTOMATION

DevCRM must connect marketing automation directly to sales.

Support:

### Lead actions

- Convert Lead
- Qualify
- Disqualify
- Assign
- Reassign
- Create Task
- Log Call
- Schedule Meeting
- Add Note
- Add Tag
- Start Nurture
- Stop Nurture

### Opportunity actions

- Create Opportunity
- Update Opportunity
- Change Stage
- Assign Owner
- Create Task
- Create Follow-up
- Notify Manager
- Escalate
- Mark Won
- Mark Lost

---

# 28. LEAD ROUTING ENGINE

Create configurable lead assignment rules.

Support:

- round robin
- territory
- geography
- product
- campaign
- lead score
- owner workload
- business unit
- source

Example:

```text
Country = Ghana
AND
Product = Residential
AND
Score > 70

→ Assign to Property Sales Team
```

---

# 29. SLA ENGINE

Provide architecture for sales response SLAs.

Examples:

```text
MQL created
→ Sales must contact within 30 minutes
```

or:

```text
High-value lead
→ Contact within 15 minutes
```

Support:

- SLA rules
- timers
- escalation
- breach events
- notifications
- management reporting

---

# 30. CAMPAIGN ATTRIBUTION

Every lead and opportunity should be traceable to marketing activity.

Track:

- original source
- original campaign
- latest source
- latest campaign
- first touch
- last touch
- campaign memberships
- campaign interactions
- opportunity attribution
- revenue attribution

Provide provision for:

### Single-touch attribution

### Multi-touch attribution

### First-touch

### Last-touch

### Linear

### Weighted attribution

---

# 31. MARKETING ANALYTICS

Build data structures supporting:

### Lead Generation

- leads generated
- leads by source
- leads by campaign
- leads by channel
- CPL

### Lead Quality

- average score
- MQL
- SQL
- qualification rate
- conversion rate

### Campaign

- sent
- delivered
- opened
- clicked
- replied
- converted
- opportunities
- revenue

### Funnel

```text
Lead
 ↓
MQL
 ↓
SQL
 ↓
Opportunity
 ↓
Won
```

### Revenue

- pipeline generated
- pipeline influenced
- revenue generated
- revenue influenced
- ROI

---

# 32. ACTIVITY MODEL

All customer interactions should be represented through a unified activity model where appropriate.

Activities include:

- Email
- SMS
- WhatsApp
- Call
- Meeting
- Task
- Note
- Form submission
- Website visit
- Campaign interaction
- Document download
- Other engagement

Each activity should support association with:

- Lead
- Contact
- Account
- Opportunity
- Campaign
- User

---

# 33. AI ARCHITECTURE

Do not tightly couple AI features to a single AI vendor.

Create an AI service abstraction.

Potential capabilities:

### AI Lead Classification

### AI Lead Scoring

### AI Intent Detection

### Conversation Summarisation

### Email Generation

### Next Best Action

### Lead Qualification

### Sentiment / Conversation Analysis

### Sales Recommendations

### Campaign Optimisation

AI actions should be usable by the automation engine.

Example:

```text
WhatsApp message received
       ↓
AI analyses intent
       ↓
Intent = "Pricing Request"
       ↓
Lead Score +20
       ↓
Create Sales Task
       ↓
Notify Owner
```

---

# 34. BACKGROUND JOBS

Do not execute heavy automation synchronously inside the user request.

Create provision for background processing.

Jobs may include:

- email sending
- SMS sending
- WhatsApp sending
- workflow execution
- workflow delays
- campaign processing
- lead scoring
- event processing
- analytics aggregation
- scheduled tasks
- webhook processing
- AI processing

The architecture should support a queue/worker system.

---

# 35. WEBHOOK FRAMEWORK

Create a generic inbound webhook architecture.

Support:

```text
POST /api/webhooks/{provider}
```

Potential webhook sources:

- email providers
- SMS providers
- WhatsApp
- payment systems
- website forms
- advertising platforms
- external CRM
- ERP
- future integrations

Webhook processing must include:

- authentication/signature verification
- idempotency
- logging
- retry handling
- error handling
- event creation

---

# 36. INTEGRATION FRAMEWORK

Create an Integration model.

Potential tables:

### Integration

- provider
- type
- status
- credentials reference
- configuration
- lastSyncAt

### IntegrationAccount

### IntegrationEvent

### IntegrationLog

### WebhookSubscription

The system should eventually support integrations with:

- Microsoft 365
- Outlook
- Gmail
- Google Calendar
- Microsoft Calendar
- WhatsApp
- SMS providers
- email providers
- Meta
- Google Ads
- Meta Ads
- LinkedIn
- payment platforms
- accounting systems
- ERP
- website
- APIs
- webhooks

Not every integration must be implemented now.

The architecture must make future integrations straightforward.

---

# 37. API-FIRST DESIGN

DevCRM must expose APIs for major CRM operations.

At minimum provide architectural provision for:

```text
Leads
Contacts
Accounts
Opportunities
Activities
Tasks
Campaigns
Segments
Workflows
Messages
Conversations
Events
Forms
Integrations
Reports
```

Support:

- authentication
- authorisation
- pagination
- filtering
- sorting
- validation
- rate limiting
- audit logging
- API versioning

---

# 38. SECURITY

Implement:

- authentication
- role-based access control
- permission-based access
- tenant/business-unit restrictions where required
- encrypted secrets
- secure credential storage
- API authentication
- webhook signature verification
- audit logs
- input validation
- output sanitisation
- rate limiting
- CSRF protection where applicable
- secure session management

Never store provider API secrets as plain text in ordinary CRM tables.

---

# 39. AUDIT LOG

Create a comprehensive audit system.

Track:

- who changed what
- old value
- new value
- entity
- entity ID
- timestamp
- source
- IP/device metadata where appropriate

Important for:

- lead ownership
- opportunity value
- campaign membership
- automation
- scoring
- customer communication
- permissions

---

# 40. DATA MODELING RULE

Avoid unnecessary duplication.

Prefer relationships such as:

```text
Lead
 ├── CampaignMembers
 ├── Activities
 ├── Events
 ├── Scores
 ├── Conversations
 ├── WorkflowExecutions
 └── Opportunities
```

rather than creating separate disconnected marketing records.

---

# 41. RECOMMENDED NEW TABLE GROUPS

At minimum investigate and accommodate the following additional Prisma models:

```text
Campaign
CampaignMember
CampaignChannel
CampaignEvent

Segment
SegmentRule
SegmentMembership

LeadScore
LeadScoreRule
LeadScoreEvent

CustomerEvent
EventType

Workflow
WorkflowVersion
WorkflowNode
WorkflowExecution
WorkflowExecutionStep
WorkflowError

DripCampaign
NurtureProgram

MessageTemplate
Message
MessageDelivery

Conversation
ConversationParticipant
ConversationMessage

CommunicationPreference
ConsentRecord

Form
FormField
FormSubmission

WebsiteEvent
TrackingSession

AttributionTouch
RevenueAttribution

Integration
IntegrationAccount
IntegrationEvent
IntegrationLog
WebhookSubscription

Notification

AIInteraction
AIRecommendation

AutomationRule
AutomationAction

SLA
SLAExecution
SLAEvent

AuditLog
```

The development team should consolidate models where appropriate rather than blindly creating every table.

---

# 42. DATABASE DESIGN PRINCIPLES

Every model must consider:

- UUID/CUID primary key strategy
- createdAt
- updatedAt
- soft deletion where appropriate
- indexing
- foreign keys
- unique constraints
- status fields
- tenant/business-unit scope where required

High-volume tables such as:

- CustomerEvent
- ConversationMessage
- Activity
- WorkflowExecution
- MessageDelivery
- WebsiteEvent

must be indexed and designed for scale.

---

# 43. EVENT-DRIVEN DESIGN

The system should follow this pattern:

```text
USER ACTION
     ↓
CRM TRANSACTION
     ↓
EVENT CREATED
     ↓
EVENT BUS / QUEUE
     ↓
AUTOMATION ENGINE
     ↓
RULE EVALUATION
     ↓
ACTION EXECUTION
     ↓
NEW EVENT
     ↓
ANALYTICS
```

Example:

```text
Lead submits form
       ↓
FORM_SUBMITTED
       ↓
Lead created
       ↓
LEAD_CREATED
       ↓
Score calculated
       ↓
LEAD_SCORE_CHANGED
       ↓
Score > 70
       ↓
MQL_CREATED
       ↓
Workflow starts
       ↓
Email + WhatsApp
       ↓
Sales task
```

This pattern is fundamental to the product.

---

# 44. ERROR HANDLING

Every external integration and automation action must have:

- retry
- timeout
- failure state
- error message
- provider response
- retry count
- dead-letter/failure handling
- administrator visibility

A failed WhatsApp message must not silently kill an entire workflow.

---

# 45. IDEMPOTENCY

External events and webhooks may be delivered multiple times.

Implement idempotency keys for:

- webhook events
- provider messages
- campaign events
- workflow actions
- payments where applicable

Do not create duplicate leads, messages, activities or workflow executions because a provider sends the same event twice.

---

# 46. WORKFLOW SAFETY

Workflows must include controls against:

- infinite loops
- duplicate execution
- excessive messaging
- repeated customer contact
- accidental mass sends
- invalid recipient data
- missing consent

Provide:

- execution limits
- frequency limits
- cooldown periods
- maximum retries
- workflow kill switch
- campaign pause
- global communication suppression

---

# 47. TESTING REQUIREMENTS

The development team must create automated tests for:

### Unit Tests

- scoring
- segmentation
- workflow conditions
- workflow actions
- attribution
- routing

### Integration Tests

- CRM → workflow
- workflow → email
- workflow → SMS
- workflow → WhatsApp
- webhook → event
- event → automation

### End-to-End Tests

Test journeys such as:

```text
Form submission
→ Lead creation
→ Score
→ Campaign
→ Email
→ WhatsApp
→ Sales task
→ Opportunity
```

---

# 48. OBSERVABILITY

Provide:

- application logs
- automation logs
- integration logs
- workflow execution logs
- webhook logs
- message delivery logs
- error monitoring
- job monitoring

Administrators must be able to answer:

> Why did this lead receive this message?

The system should show:

```text
Lead
 ↓
Event
 ↓
Workflow
 ↓
Condition
 ↓
Action
 ↓
Message
```

---

# 49. ADMINISTRATION

Provide administrative controls for:

- workflow management
- campaign management
- integrations
- providers
- message templates
- scoring rules
- segments
- lead routing
- SLAs
- communication preferences
- automation limits
- API keys
- webhooks
- system settings

---

# 50. UI MODULE STRUCTURE

The application should ultimately support navigation similar to:

```text
Dashboard

CRM
 ├── Leads
 ├── Contacts
 ├── Accounts
 ├── Opportunities
 ├── Activities
 ├── Tasks
 └── Calendar

Marketing
 ├── Campaigns
 ├── Audiences
 ├── Segments
 ├── Forms
 ├── Email
 ├── SMS
 ├── WhatsApp
 ├── Drip Campaigns
 └── Journeys

Automation
 ├── Workflows
 ├── Workflow Templates
 ├── Executions
 ├── Rules
 └── Automation Logs

Engagement
 ├── Conversations
 ├── Email
 ├── SMS
 ├── WhatsApp
 └── Activity Timeline

Analytics
 ├── Lead Generation
 ├── Campaigns
 ├── Funnel
 ├── Attribution
 ├── Revenue
 └── Automation

Administration
 ├── Users
 ├── Roles
 ├── Integrations
 ├── Providers
 ├── Templates
 ├── Scoring
 ├── Segments
 ├── SLAs
 └── Audit Logs
```

---

# 51. CUSTOMER 360

Every Lead, Contact and Account should eventually have a consolidated timeline.

Example:

```text
CUSTOMER 360

Contact Information
Lead Information
Lead Score
Lifecycle Stage
Owner
Campaigns
Segments
Opportunities
Orders
Tasks
Meetings
Emails
SMS
WhatsApp
Website Activity
Forms
Documents
Notes
AI Insights
Revenue
Attribution
```

This should become one of the defining features of DevCRM.

---

# 52. EXAMPLE END-TO-END JOURNEY

The development architecture must be capable of implementing this journey:

```text
Prospect visits website
        ↓
Completes enquiry form
        ↓
FORM_SUBMITTED
        ↓
Duplicate check
        ↓
Lead created
        ↓
Lead source recorded
        ↓
Campaign membership created
        ↓
Initial lead score calculated
        ↓
Welcome email
        ↓
WhatsApp acknowledgement
        ↓
Wait 2 days
        ↓
Check engagement
       / \
     YES  NO
      |    |
      |   Send follow-up
      |
Visit pricing page
      ↓
Intent score +20
      ↓
Lead score > 70
      ↓
MQL
      ↓
Sales owner assigned
      ↓
Create task
      ↓
Notify salesperson
      ↓
Salesperson contacts lead
      ↓
Qualified
      ↓
Convert / Create Opportunity
      ↓
Opportunity pipeline
      ↓
Deal won
      ↓
Customer onboarding journey
      ↓
Upsell / Cross-sell
```

The architecture must support this without custom coding every individual journey.

---

# 53. DEVELOPMENT PRIORITY

Do not attempt to build every feature simultaneously.

Recommended sequence:

## PHASE 1 — FOUNDATION

- Prisma schema
- CRM entities
- activities
- event architecture
- audit logging
- API foundation
- authentication
- permissions

## PHASE 2 — AUTOMATION CORE

- event engine
- workflow engine
- triggers
- conditions
- actions
- delays
- workflow execution
- logging

## PHASE 3 — MARKETING

- campaigns
- segments
- campaign members
- email
- templates
- drip campaigns
- lead scoring

## PHASE 4 — OMNICHANNEL

- communication abstraction
- email provider
- SMS provider
- WhatsApp provider
- conversations
- message tracking
- consent

## PHASE 5 — SALES AUTOMATION

- lead routing
- qualification
- conversion
- task creation
- meeting automation
- SLAs
- sales alerts

## PHASE 6 — ANALYTICS

- campaign analytics
- funnel
- attribution
- revenue
- automation analytics

## PHASE 7 — AI

- intent
- scoring
- summarisation
- recommendations
- next-best-action
- AI-assisted campaign creation

---

# 54. IMPORTANT DEVELOPMENT RULES

### Rule 1

Do not hard-code business rules into UI components.

Business logic belongs in reusable services/modules.

### Rule 2

Do not build each communication channel independently.

Use the common engagement/provider architecture.

### Rule 3

Do not make workflows dependent on individual screens.

Workflows must operate at the service/event level.

### Rule 4

Do not hard-code lead scoring.

Scoring must be configurable.

### Rule 5

Do not hard-code campaign logic.

Campaigns must use the same automation engine.

### Rule 6

Do not hard-code provider APIs into CRM logic.

Use adapters/interfaces.

### Rule 7

Every important customer interaction should be capable of generating an event.

### Rule 8

Every automation action must be auditable.

### Rule 9

Design for future channels even where the integration is not yet implemented.

### Rule 10

Do not compromise the existing CRM data model merely to simplify marketing development.

---

# 55. DEFINITION OF DONE

A feature is not considered complete merely because its UI works.

Each feature must have:

- database model
- Prisma migration
- service layer
- validation
- API/service interface
- permission handling
- audit logging where applicable
- event generation where applicable
- automation compatibility
- error handling
- test coverage
- documentation

---

# 56. REQUIRED DEVELOPER DELIVERABLES

Before significant implementation begins, the development team must produce:

### 1. Architecture Diagram

Showing:

```text
Next.js
Prisma
Database
Event Engine
Automation Engine
Queue/Workers
Integration Layer
Omnichannel Providers
Analytics
AI Layer
```

### 2. Prisma ERD

Show all existing and proposed entities.

### 3. Database Migration Plan

Identify:

- existing tables
- modified tables
- new tables
- relationships
- indexes
- constraints

### 4. Event Catalogue

Document all supported event types.

### 5. Automation Specification

Document:

- triggers
- conditions
- actions
- operators
- execution model

### 6. Integration Architecture

Document provider abstraction and webhook architecture.

### 7. API Specification

Document endpoints and payloads.

### 8. Security Model

Document:

- roles
- permissions
- authentication
- secrets
- audit

### 9. Testing Strategy

Include:

- unit
- integration
- E2E
- load
- security

### 10. Phased Development Backlog

Break the architecture into implementable epics, stories and tasks.

---

# 57. FINAL PRODUCT OBJECTIVE

The final DevCRM architecture must enable the business to operate a complete revenue lifecycle from a single platform:

```text
                 MARKETING
                     |
              Lead Generation
                     |
              Lead Capture
                     |
              Enrichment
                     |
              Segmentation
                     |
               Lead Scoring
                     |
               Nurturing
                     |
              Qualification
                     |
              SALES HANDOFF
                     |
                Opportunity
                     |
                 Pipeline
                     |
                  Closed
                     |
                 CUSTOMER
                     |
             Onboarding
                     |
             Engagement
                     |
             Retention
                     |
             Upsell/Cross-sell
                     |
                 REVENUE
                     |
              ATTRIBUTION
```

The underlying architecture should make this possible through:

> **CRM + Events + Automation + Omnichannel Engagement + Analytics + AI**

rather than through disconnected modules.

---

# 58. FINAL INSTRUCTION TO THE DEVELOPMENT TEAM

Treat this document as the **architectural direction and capability specification for DevCRM Next**.

Do not interpret the absence of an immediate implementation requirement as permission to design an architecture that prevents the capability later.

Where an integration is not being implemented in the current sprint, create the appropriate:

- interface
- adapter
- data model
- configuration structure
- webhook architecture
- event type
- service boundary

so that the integration can be added later without restructuring the CRM.

Where a feature is scheduled for a later phase, ensure the current database schema, API design and service architecture can accommodate it.

**Build the foundation once. Extend it repeatedly.**

The ultimate objective is to create a CRM that can move from:

> **Lead → Engagement → Qualification → Opportunity → Customer → Revenue**

while allowing every stage to be automated, measured and connected across channels.

**Do not build DevCRM as a collection of screens. Build it as an event-driven revenue platform with a CRM interface.**