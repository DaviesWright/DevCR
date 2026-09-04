# ENTERPRISE REAL ESTATE CRM FRONTEND ARCHITECTURE
## Built to Salesforce & HubSpot Standards – Fully Integrated with Enterprise Schema

> **Status: DRAFT — not yet reviewed/approved for build.** See `docs/architecture-review.md` for the critical review of this plan before committing engineering time.

---

## 1. APPLICATION LAYOUT & NAVIGATION

### Global Navigation (Persistent Header)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 Devtraco CRM    🔍 [Global Search]    🔔  📊  👤 John Doe │
├─────────────────────────────────────────────────────────────────┤
│ Dashboard │ Leads │ Customers │ Projects │ Sales │ Construction │ 
│ Finance   │ CX    │ Facilities │ Reports │ Admin              │
└─────────────────────────────────────────────────────────────────┘
```

### Sidebar (Contextual – Changes by Module)

```
┌──────────┐
│ 📌 Quick │
│  Actions │
├──────────┤
│ + New Lead│
│ + New Sale│
│ + Log Call│
│ + Add Note│
├──────────┤
│ 📋 Views  │
│ My Leads  │
│ All Open  │
│ Hot Leads │
│ Unassigned│
├──────────┤
│ 📊 Reports│
│ Pipeline  │
│ Conversion│
└──────────┘
```

---

## 2. DASHBOARD (Home Page)

### KPI Cards (Real-time)

```tsx
// Component: DashboardKPIs
interface KPI {
  title: string;
  value: number | string;
  change: number; // % change
  trend: 'up' | 'down' | 'flat';
  period: 'Today' | 'This Week' | 'This Month' | 'QTD';
  icon: ReactNode;
  color: string;
}

const kpis: KPI[] = [
  { 
    title: 'Active Leads', 
    value: 1247, 
    change: 12.5, 
    trend: 'up',
    period: 'This Month',
    icon: <UsersIcon />,
    color: 'blue'
  },
  { 
    title: 'Units Available', 
    value: 342, 
    change: -5.2, 
    trend: 'down',
    period: 'QTD',
    icon: <HomeIcon />,
    color: 'green'
  },
  { 
    title: 'Revenue (GHS)', 
    value: '₵4.2M', 
    change: 8.7, 
    trend: 'up',
    period: 'This Month',
    icon: <DollarIcon />,
    color: 'gold'
  },
  { 
    title: 'Open Cases', 
    value: 89, 
    change: -3.1, 
    trend: 'down',
    period: 'This Week',
    icon: <TicketIcon />,
    color: 'red'
  }
];
```

### Pipeline Charts

```tsx
// Component: SalesFunnel
const funnelData = [
  { stage: 'New Leads', count: 450, value: 0 },
  { stage: 'Qualified', count: 280, value: 0 },
  { stage: 'Site Visits', count: 190, value: 0 },
  { stage: 'Reservations', count: 95, value: '₵8.2M' },
  { stage: 'Contracts', count: 48, value: '₵4.1M' },
  { stage: 'Closed Won', count: 32, value: '₵2.8M' }
];
```

### Activity Feed (HubSpot-style Timeline)

```tsx
// Component: RecentActivity
const recentActivities = [
  { 
    type: 'lead_created', 
    user: 'Jane Agent', 
    entity: 'John Doe', 
    time: '5 mins ago',
    icon: '➕',
    details: 'New lead from website - interested in 3-bedroom'
  },
  { 
    type: 'payment_received', 
    user: 'Finance', 
    entity: 'Unit A-101', 
    time: '1 hour ago',
    icon: '💰',
    details: '₵50,000 deposit received from Mr. Kwame'
  },
  { 
    type: 'complaint_updated', 
    user: 'Sarah Support', 
    entity: 'Plumbing Issue #C-0234', 
    time: '2 hours ago',
    icon: '✅',
    details: 'Resolved - maintenance dispatched'
  }
];
```

### Smart Alerts & Notifications

```tsx
// Component: NotificationCenter
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action: string;
  link: string;
  timestamp: Date;
  read: boolean;
}

// Examples:
// ⚠️ 5 contracts expire in 7 days
// 🔔 12 new leads assigned to you
// 💰 3 payments overdue > 30 days
// 🏗️ Unit construction delay: Block B - Foundation behind schedule
```

---

## 3. LEAD MANAGEMENT (HubSpot-style)

### Lead List View (with Filtering)

```tsx
// Component: LeadList
interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  score: number; // 0-100
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';
  assigned_to: string;
  created_at: Date;
  last_activity: Date;
  budget_range: string;
  property_interest: string;
}

// Features:
// - Column visibility toggle
// - Bulk actions (assign, change status, delete)
// - Quick filters: Status, Source, Assigned, Score
// - Export to CSV/Excel
// - Sorting on all columns
```

### Lead Detail View (Salesforce-style Layout)

```tsx
// Component: LeadDetail
<Tabs>
  <Tab label="Overview">
    <LeadHeader 
      lead={lead}
      actions={['Convert', 'Add Task', 'Log Email', 'Schedule Meeting']}
    />
    <LeadScore score={85} />
    <KeyDetails 
      fields={[
        { label: 'Email', value: lead.email, action: 'mailto' },
        { label: 'Phone', value: lead.phone, action: 'call' },
        { label: 'Source', value: lead.source },
        { label: 'Assigned To', value: lead.assigned_to },
        { label: 'Budget', value: `₵${lead.budget_range}` },
        { label: 'Interest', value: lead.property_interest }
      ]}
    />
    <ActivityTimeline activities={lead.activities} />
  </Tab>
  <Tab label="Activities">
    <ActivityLog 
      filter={['Email', 'Call', 'Meeting', 'Note', 'Site Visit']}
      addAction={addActivity}
    />
  </Tab>
  <Tab label="Opportunities">
    <OpportunityList 
      leadId={lead.id} 
      opportunities={lead.opportunities}
    />
  </Tab>
  <Tab label="Documents">
    <DocumentList 
      entityType="lead" 
      entityId={lead.id}
    />
  </Tab>
</Tabs>
```

### Lead Conversion Modal

```tsx
// Component: ConvertLeadModal
interface ConversionData {
  createAccount: boolean;
  accountName: string;
  createOpportunity: boolean;
  opportunityName: string;
  opportunityAmount: number;
  closeDate: Date;
  assignTo: string;
  convertTo: 'contact' | 'customer';
  createHandover?: boolean;
}
```

### Sample Lead List View

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Search leads...  [Filter ▼]  [Columns ▼]  [+ New Lead] [Import]│
├─────────────────────────────────────────────────────────────────────┤
│ ☐ │ Name         │ Email          │ Source   │ Score │ Status    │
│ ☐ │ John Doe     │ john@email.com │ Website  │ 85🔵  │ Qualified │
│ ☐ │ Mary Smith   │ mary@email.com │ Referral │ 92🟢  │ Hot       │
│ ☐ │ James Brown  │ james@email.com│ Event    │ 45🔴  │ New       │
│ ☐ │ Sarah Jones  │ sarah@email.com│ Social   │ 78🟡  │ Contacted │
├─────────────────────────────────────────────────────────────────────┤
│ Showing 1-4 of 1,247  [< 1 2 3 ... 312 >]  [Export]              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. PROJECT & INVENTORY MANAGEMENT

### Project Dashboard

```tsx
// Component: ProjectDashboard
const project = {
  id: 'dev-001',
  name: 'Airport Hills Residences',
  status: 'Construction',
  progress: 65, // %
  total_units: 240,
  sold_units: 87,
  available_units: 153,
  revenue_realized: '₵12.4M',
  expected_completion: '2027-06-30'
};

// Tab structure:
// - Overview (KPIs, progress bar, timeline)
// - Inventory (Unit grid with status colors)
// - Construction (Stages, snagging)
// - Sales (Reservations, Contracts)
// - Documents
```

### Unit Inventory Grid (Salesforce-style)

```tsx
// Component: UnitGrid
// Visual floor plan with color-coded units
interface UnitTile {
  unit_number: string;
  status: 'Available' | 'Reserved' | 'Sold' | 'Under Construction' | 'Handed Over';
  price: number;
  bedrooms: number;
  floor: number;
  onClick: () => void;
}

// Colors:
// 🟢 Available - Green
// 🟡 Reserved - Yellow  
// 🔴 Sold - Red
// 🔵 Under Construction - Blue
// 🟣 Handed Over - Purple

// Clicking opens Unit Detail Drawer
```

### Sample Unit Inventory Grid

```
┌─────────────────────────────────────────────────────────────────────┐
│ Airport Hills Residences │ Floor: 3 │ 4 Units │ Filter: All      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                        │
│  │ 301   │  │ 302   │  │ 303   │  │ 304   │                        │
│  │ 🟢    │  │ 🔴    │  │ 🟡    │  │ 🟢    │                        │
│  │ 3-bed │  │ 3-bed │  │ 4-bed │  │ 2-bed │                        │
│  │ ₵850K │  │ ₵850K │  │ ₵1.2M │  │ ₵650K │                        │
│  └──────┘  └──────┘  └──────┘  └──────┘                        │
│                                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                        │
│  │ 305   │  │ 306   │  │ 307   │  │ 308   │                        │
│  │ 🔵    │  │ 🟢    │  │ 🟢    │  │ 🟢    │                        │
│  │ 3-bed │  │ 3-bed │  │ 3-bed │  │ 3-bed │                        │
│  │ ₴850K │  │ ₴850K │  │ ₴850K │  │ ₴850K │                        │
│  └──────┘  └──────┘  └──────┘  └──────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Unit Detail View

```tsx
// Component: UnitDetail
<Tabs>
  <Tab label="Details">
    <UnitSpecs 
      specs={unit}
      features={unit.features}
    />
    <PricingHistoryChart data={unit.priceHistory} />
    <UnitStatusTimeline statusHistory={unit.statusHistory} />
  </Tab>
  <Tab label="Sales">
    <SalesHistory unitId={unit.id} />
    <CurrentReservation reservation={unit.reservation} />
    <ContractDetails contract={unit.contract} />
  </Tab>
  <Tab label="Construction">
    <ConstructionProgress unitId={unit.id} />
    <SnaggingList unitId={unit.id} />
  </Tab>
  <Tab label="Customer">
    <CurrentOwner customer={unit.owner} />
    <HandoverInfo handover={unit.handover} />
    <Complaints unitId={unit.id} />
  </Tab>
  <Tab label="Maintenance">
    <AssetList unitId={unit.id} />
    <MaintenanceRequests unitId={unit.id} />
  </Tab>
</Tabs>
```

### Interactive Floor Map (Canvas/Leaflet)

```tsx
// Component: FloorPlan
// Drag-select multiple units
// Right-click for quick actions
// Color legend
// Filters by bedrooms, price range, status
// Export to PDF/Image
```

---

## 5. SALES & OPPORTUNITY PIPELINE

### Sales Pipeline (Kanban Board)

```tsx
// Component: SalesPipeline
const stages = [
  { id: 'prospecting', label: 'Prospecting', color: '#gray' },
  { id: 'qualified', label: 'Qualified', color: '#blue' },
  { id: 'site_visit', label: 'Site Visit', color: '#purple' },
  { id: 'reservation', label: 'Reservation', color: '#yellow' },
  { id: 'negotiation', label: 'Negotiation', color: '#orange' },
  { id: 'contract', label: 'Contract', color: '#teal' },
  { id: 'closed_won', label: 'Closed Won', color: '#green' },
  { id: 'closed_lost', label: 'Closed Lost', color: '#red' }
];

// Drag-and-drop opportunities between stages
// Each card shows: Customer name, Unit, Amount, Agent, Days in stage
// Click opens Opportunity Detail
```

### Sales Dashboard

```tsx
// KPIs:
// - Pipeline Value: ₵18.4M
// - Weighted Pipeline: ₵12.1M
// - Win Rate: 43%
// - Average Deal Size: ₵850K
// - Average Sales Cycle: 45 days

// Charts:
// - Funnel Chart (by stage)
// - Forecast (monthly projection)
// - Unit Sales by Project
// - Agent Performance
```

### Opportunity Detail View

```tsx
// Component: OpportunityDetail
<Tabs>
  <Tab label="Overview">
    <OpportunityHeader 
      customer={customer}
      unit={unit}
      agent={agent}
    />
    <DealMetrics 
      amount={amount}
      probability={probability}
      expectedClose={expectedClose}
    />
    <Timeline activities={activities} />
  </Tab>
  <Tab label="Reservation">
    <ReservationDetails reservation={reservation} />
    <ExtensionHistory extensions={extensions} />
  </Tab>
  <Tab label="Contract">
    <ContractBuilder contract={contract} />
    <AmendmentHistory amendments={amendments} />
  </Tab>
  <Tab label="Payments">
    <PaymentPlan plan={paymentPlan} />
    <PaymentSchedule schedule={schedule} />
    <PaymentHistory payments={payments} />
  </Tab>
</Tabs>
```

### Contract Builder (DocuSign-style)

```tsx
// Component: ContractBuilder
// Step 1: Select Template
// Step 2: Fill Variables (customer, unit, price, terms)
// Step 3: Preview PDF
// Step 4: Add Signature Fields
// Step 5: Send for e-Signature
// Step 6: Track Status (Sent, Opened, Signed, Completed)
```

---

## 6. CUSTOMER EXPERIENCE (CX) MODULE

### Customer 360 View (Salesforce-inspired)

```tsx
// Component: Customer360
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  units_owned: Unit[];
  total_invested: number;
  nps_score: number;
  open_cases: number;
  last_interaction: Date;
}

// Tabs:
// 1. Profile (KYC docs, contact info, preferences)
// 2. Properties (owned units with status)
// 3. Sales (contracts, payments, handovers)
// 4. Support (complaints, warranty claims, work orders)
// 5. Communications (email history, call logs)
// 6. Documents (all uploaded documents)
```

### Sample Customer 360 View

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back  │  Mr. Kwame Mensah  │  KYC: ✅  │  📞  ✉️  📁           │
├─────────────────────────────────────────────────────────────────────┤
│ 👤 Profile      🏠 Properties    💰 Payments    🎫 Cases    📊   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│ │ Unit: A-203   │  │ Unit: B-105   │  │ Total Invested│          │
│ │ Status: Sold  │  │ Status: Handed│  │ ₵1.85M        │          │
│ │ Handover: Jan │  │ Value: ₵550K  │  │ NPS: 9 ⭐     │          │
│ └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                  │
│ Recent Activity:                                                 │
│ 2026-09-01 10:30 │ Payment received: ₵50,000                     │
│ 2026-08-28 14:15 │ Complaint opened: Plumbing issue              │
│ 2026-08-25 09:00 │ Site visit scheduled                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Complaint Management (Service Cloud-style)

```tsx
// Component: ComplaintList
// Features:
// - SLA timers (Response/Resolution)
// - Priority matrix
// - Automated escalation
// - Customer notifications
// - Status tracking (Open → Assigned → In Progress → Resolved → Closed)

const complaint = {
  id: 'C-2026-089',
  customer: 'Mr. Kwame Mensah',
  unit: 'A-203',
  category: 'Plumbing',
  priority: 'High',
  status: 'In Progress',
  opened: '2026-08-28 10:30',
  sla_response: '2 hours remaining',
  sla_resolution: '18 hours remaining',
  assigned_to: 'Michael (Maintenance)',
  updates: [...]
};

// Escalation Rules:
// - Priority High: Response < 4hrs, Resolution < 24hrs
// - Escalate if SLA breach imminent
// - Auto-assign based on category and workload
```

### Work Order Management

```tsx
// Component: WorkOrderDashboard
// Features:
// - Dispatch board (map view of maintenance teams)
// - Resource allocation (technician availability)
// - Parts inventory integration
// - Customer approvals for extra costs
// - Photo uploads (before/after)
// - Completion verification
```

### Handover Portal

```tsx
// Component: HandoverPortal
// Steps:
// 1. Pre-handover inspection (snagging check)
// 2. Customer walkthrough
// 3. Document signing
// 4. Key collection
// 5. Welcome pack delivery
// 6. Feedback survey

// Features:
// - Digital checklists
// - Photo/video uploads
// - Customer e-signature
// - Automated welcome email
// - NPS survey
// - Warranty registration
```

---

## 7. FINANCE MODULE

### Payment Dashboard

```tsx
// Component: FinanceDashboard
// KPIs:
// - Monthly Revenue: ₵2.1M
// - Outstanding Payments: ₵8.7M
// - Overdue (>30 days): ₵1.2M
// - Conversion Rate: 87%

// Tab structure:
// - Invoices (list with status)
// - Payments (receipts, allocations)
// - Payment Plans (active, overdue)
// - Refunds (pending, approved)
// - Reporting (financial statements, P&L)
```

### Payment Plan Visualizer

```tsx
// Component: PaymentPlanVisualizer
// Gantt-style timeline of installments
// Each installment: Due date, Amount, Status (Paid/Pending/Overdue)
// Highlight overdue payments in red
// Click to see payment details

const paymentPlan = {
  total: '₵850,000',
  down_payment: '₵170,000 (20%)',
  installments: [
    { number: 1, due: '2026-09-30', amount: '₵113,333', status: 'Pending' },
    { number: 2, due: '2026-10-31', amount: '₵113,333', status: 'Pending' },
    // ...
    { number: 6, due: '2027-02-28', amount: '₵113,337', status: 'Pending' }
  ]
};
```

### Receipt & Invoice Generation

```tsx
// Component: InvoiceGenerator
// Features:
// - Auto-populate from sale/payment
// - Template selection
// - Tax calculation (VAT, withholding)
// - PDF preview
// - Email to customer
// - Print & download
// - Mark as paid
```

### Payment Reconciliation

```tsx
// Component: Reconciliation
// Matches bank statements with system payments
// Identifies unmatched transactions
// Bulk approve/reject
// Audit trail
// Export for accounting (Sage/QuickBooks)
```

---

## 8. CONSTRUCTION MANAGEMENT

### Construction Dashboard

```tsx
// Component: ConstructionDashboard
// KPIs:
// - Overall Progress: 65%
// - Units Completed: 142/240
// - Snags Open: 47
// - Critical Issues: 3
// - On Schedule: Yes (2 days ahead)

// Gantt Chart (view by project/phase/block)
// Milestones with status indicators
// Delay warnings (red flags)
// Resource allocation (contractors, materials)
```

### Snagging Management

```tsx
// Component: SnaggingInspector
// Features:
// - Unit selection (filter by stage)
// - Digital checklist (category-based)
// - Photo upload with annotations
// - Auto-assign to contractors
// - Status tracking (Open → Assigned → Fixed → Verified)
// - Sign-off by inspector
// - Handover approval
```

### Construction Timeline (MS Project-style)

```tsx
// Component: Timeline
// Interactive Gantt chart
// Drag to reschedule
// Critical path highlighting
// Resource smoothing
// Progress % per task
// Actual vs Planned
```

---

## 9. FACILITIES & ASSET MANAGEMENT

### Asset Registry

```tsx
// Component: AssetList
// Tree view: Development → Building → Floor → Unit → Asset
// Features:
// - QR code generation (for physical asset)
// - Maintenance history
// - Warranty tracking
// - Insurance details
// - Lifecycle status (Operational/Under Maintenance/Retired)
```

### Maintenance Schedule (Calendar View)

```tsx
// Component: MaintenanceCalendar
// Features:
// - Monthly/Weekly view
// - Auto-generate recurring tasks
// - Technician assignment
// - Parts inventory
// - Customer notification
// - Completion feedback
```

### Service Charge Billing

```tsx
// Component: ServiceChargeManager
// Features:
// - Bulk generate charges by unit
// - Prorate for new owners
// - Send statements
// - Track payments
// - Penalty for late payment
// - Sinking fund management
```

---

## 10. REPORTING & ANALYTICS (Tableau-style)

### Custom Report Builder

```tsx
// Component: ReportBuilder
// Drag-and-drop interface:
// - Columns: Select fields from any table
// - Filters: Conditions (AND/OR)
// - Grouping: Aggregate by...
// - Sorting: ASC/DESC
// - Charts: Bar, Line, Pie, Scatter
// - Save reports (personal/shared)
// - Schedule email delivery

// Pre-built Reports:
// 1. Sales Pipeline (by stage, agent, project)
// 2. Unit Inventory (by status, type, price)
// 3. Financial (revenue, AR, collections)
// 4. Construction Progress (unit status, snagging)
// 5. Customer Experience (NPS, complaints, resolution)
// 6. Commission (agent performance, pending payouts)
// 7. Lead Conversion (source, funnel, ROI)
```

### Executive Dashboard

```tsx
// Component: ExecutiveDashboard
// High-level KPIs across all modules
// Drill-down to detailed reports
// Year-over-year comparisons
// Forecasts (machine learning)
// Anomaly detection
// Customizable widgets
// Role-based views (CEO, Sales Director, Construction Manager)
```

### AI-Powered Insights

```tsx
// Component: AIPredictions
// - Lead conversion probability
// - Optimal pricing recommendations
// - Customer churn risk
// - Maintenance prediction (proactive)
// - Sales forecast accuracy
// - Market trend analysis
```

---

## 11. ADMINISTRATION & SETTINGS

### User Management (Salesforce-style)

```tsx
// Component: UserManagement
// Features:
// - User list with roles & permissions
// - Role hierarchy
// - Permission sets (granular)
// - Login history
// - Session management
// - 2FA enforcement
// - API key generation
// - Audit trail

// Permissions Matrix:
// Module     Create  Read  Update  Delete  Approve
// Leads         ✅     ✅     ✅      ✅       ❌
// Customers     ✅     ✅     ✅      ✅       ❌
// Units         ❌     ✅     ✅      ❌       ❌
// Payments      ✅     ✅     ✅      ❌       ✅
// Contracts     ✅     ✅     ✅      ❌       ✅
// Complaints    ✅     ✅     ✅      ✅       ❌
```

### Workflow Automation (HubSpot-style)

```tsx
// Component: WorkflowAutomation
// Drag-and-drop workflow builder
// Triggers:
// - Lead status changes
// - Payment received
// - Complaint created
// - Unit handover
// - Email opened

// Actions:
// - Assign task to user
// - Send email template
// - Update field
// - Create follow-up
// - Send SMS
// - Webhook call

// Example Workflows:
// 1. New Lead → Auto-assign to agent → Send welcome email → Create follow-up task
// 2. Reservation Expires → Notify agent → Update unit status → Send reminder to customer
// 3. Complaint Escalates → Notify manager → Create work order → Assign contractor
```

### Data Import/Export (Bulk Operations)

```tsx
// Component: DataImporter
// Support CSV, Excel, JSON
// Field mapping
// Data validation
// Duplicate detection
// Rollback on error
// Schedule recurring imports

// Export Formats: CSV, Excel, PDF, XLSX
// Export Options: Current view, All records, Selected
```

---

## 12. MOBILE APP (React Native)

### Key Mobile Features

```tsx
// Sales Agent App
// - Lead management (view, add, call)
// - Unit inventory (available units, photos)
// - Appointment scheduling
// - QR code scanning (unit ID)
// - Check-in at site visits
// - Commission dashboard

// Maintenance App
// - Work order assignments
// - GPS location tracking
// - Photo upload (before/after)
// - Parts inventory check
// - Time tracking
// - Customer feedback

// Customer Portal
// - Unit status (construction progress)
// - Payment history
// - Complaint submission
// - Maintenance requests
// - Handover documents
// - Support chat
// - Community announcements
```

---

## 13. INTEGRATION LAYER

### API Gateway

```tsx
// RESTful endpoints matching schema
GET    /api/v1/leads
POST   /api/v1/leads
GET    /api/v1/leads/:id
PUT    /api/v1/leads/:id
DELETE /api/v1/leads/:id

GET    /api/v1/units?status=available&project=dev-001
POST   /api/v1/reservations
POST   /api/v1/payments

// Webhooks for external systems
POST /webhooks/salesforce
POST /webhooks/hubspot
POST /webhooks/quickbooks
POST /webhooks/twilio
```

### Third-Party Integrations

```tsx
// Communication
- Twilio (SMS, Voice)
- SendGrid (Email)
- WhatsApp Business API

// Payments
- Paystack
- Flutterwave
- Mobile Money (MTN, Vodafone)

// Documents
- DocuSign (e-Signature)
- Adobe Sign
- Google Drive/OneDrive integration

// Maps
- Google Maps API
- Leaflet/OpenStreetMap

// Accounting
- QuickBooks
- Sage
- Xero

// Construction
- Procore
- Autodesk BIM 360
```

---

## 14. TECHNOLOGY STACK (Recommended)

### Frontend

```typescript
// Framework
- React 18+ (with TypeScript)
- Next.js 14+ (App Router)
- Tailwind CSS + Material-UI

// State Management
- Redux Toolkit / Zustand
- React Query (TanStack)
- Formik + Yup (forms)

// Charts & Visualization
- Recharts / Chart.js
- D3.js
- AG Grid (tables)

// Calendar
- FullCalendar
- React Big Calendar

// Drag & Drop
- React DnD
- dnd-kit

// PDF Generation
- React PDF
- JSPDF
- PDFKit

// Maps
- Mapbox / Leaflet

// Real-time
- Socket.io
- Pusher
```

### Backend

```typescript
// API
- Node.js + Express / NestJS
- GraphQL (Apollo) optional
- WebSockets for real-time

// Database
- PostgreSQL 15+ (with TimescaleDB for time-series)
- Redis (caching, sessions, pub/sub)
- ElasticSearch (full-text search)

// Queue
- Bull (Redis) / RabbitMQ

// Authentication
- JWT
- OAuth 2.0
- SAML (enterprise)

// File Storage
- AWS S3 / Azure Blob / Google Cloud Storage
- CDN integration
```

---

## 15. DEPLOYMENT & INFRASTRUCTURE

### Docker Compose

```yaml
services:
  web:
    build: ./frontend
    ports:
      - "3000:3000"
  api:
    build: ./backend
    ports:
      - "3001:3001"
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: devtraco_crm
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7
  nginx:
    image: nginx
    ports:
      - "80:80"
      - "443:443"
```

### Kubernetes (Production)

- Auto-scaling
- Load balancing
- Blue/Green deployments
- Istio service mesh
- Prometheus + Grafana monitoring
- ELK stack (logging)

---

## 16. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-4)

- ✅ Database schema creation
- ✅ Authentication & Authorization
- ✅ Basic CRUD (Leads, Customers, Units)
- ✅ API endpoints
- ✅ Admin dashboard

### Phase 2: Core CRM (Weeks 5-8)

- ✅ Lead management (full)
- ✅ Customer 360
- ✅ Sales pipeline
- ✅ Unit inventory
- ✅ Activity logging

### Phase 3: Sales & Finance (Weeks 9-12)

- ✅ Payment plans
- ✅ Invoices & receipts
- ✅ Contract management
- ✅ Commission tracking
- ✅ Reporting

### Phase 4: Construction & CX (Weeks 13-16)

- ✅ Construction tracking
- ✅ Snagging inspection
- ✅ Handover process
- ✅ Complaint management
- ✅ Work orders

### Phase 5: Advanced (Weeks 17-20)

- ✅ Workflow automation
- ✅ AI insights
- ✅ Mobile apps
- ✅ Integrations
- ✅ Performance optimization

### Phase 6: Launch (Weeks 21-24)

- ✅ User training
- ✅ Data migration
- ✅ UAT
- ✅ Go-live
- ✅ Support & monitoring

---

## 17. KEY USER EXPERIENCE PRINCIPLES

### Adopted from Salesforce & HubSpot

1. **Single Source of Truth** - All data linked via relationships
2. **Contextual Actions** - Actions based on current view/record
3. **Smart Search** - Unified global search with filters
4. **Activity Timeline** - Chronological view of all interactions
5. **Infinite Scroll** - Load more data as needed
6. **Undo/Redo** - Ability to revert actions
7. **Keyboard Shortcuts** - Power user efficiency
8. **Mobile-First** - Responsive design
9. **Real-Time Updates** - WebSocket notifications
10. **Role-Based Views** - Tailored experience by role

### Performance Optimizations

```typescript
// Virtual scrolling for large lists
// Debounced search
// Lazy loading (code splitting)
// Caching (React Query, Redis)
// Pagination (cursor-based)
// Optimistic UI updates
// Service Workers (offline support)
```

---

## 18. READY-TO-USE COMPONENTS (Example Code)

### LeadCard.tsx – Reusable Lead Component

```tsx
import { Card, Badge, Avatar } from '@/components/ui';

export const LeadCard = ({ lead, onStatusChange }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={lead.name} />
          <div>
            <h3 className="font-medium">{lead.name}</h3>
            <p className="text-sm text-gray-500">{lead.email}</p>
          </div>
        </div>
        <Badge color={getScoreColor(lead.score)}>
          {lead.score}%
        </Badge>
      </div>
      <div className="mt-3 flex gap-2">
        <Badge variant="outline">{lead.source}</Badge>
        <Badge variant="outline">{lead.status}</Badge>
        <Badge variant="outline">{lead.budget}</Badge>
      </div>
      <div className="mt-3 flex justify-between text-sm text-gray-500">
        <span>Assigned: {lead.assigned_to}</span>
        <span>Created: {format(lead.created_at, 'MMM d, yyyy')}</span>
      </div>
    </Card>
  );
};
```

---

## 19. SUMMARY

This **Salesforce/HubSpot-grade CRM frontend** is:

- ✅ **Fully integrated** with your enterprise schema
- ✅ **Role-based** (Sales, Construction, Finance, CX, Admin)
- ✅ **Mobile-responsive** and accessible
- ✅ **Feature-rich** (pipeline, automation, AI insights)
- ✅ **Production-ready** (performance, security, scalability)

**Time to build:** 6-9 months (full team)  
**Technology:** React/Next.js + Node.js + PostgreSQL  
**Team size:** 8-12 developers + QA + Product Manager

---

## 20. NEXT STEPS

### Immediate Actions

1. **Choose Tech Stack** - React vs Vue, Node vs Python
2. **Setup Development Environment** - Docker, Git, CI/CD
3. **Create Database** - Run DDL scripts from earlier schema
4. **Build Authentication** - JWT + roles
5. **Implement Core CRUD** - Leads, Customers, Units

### Sprint Plan (2-week cycles)

- **Sprint 1**: Authentication + User Management
- **Sprint 2**: Lead Management (list, detail, create)
- **Sprint 3**: Unit Inventory (grid, detail, filtering)
- **Sprint 4**: Sales Pipeline (kanban, opportunities)
- **Sprint 5**: Customer 360 (profile, properties, interactions)
- **Sprint 6**: Finance (payments, invoices, receipts)
- **Sprint 7**: Construction (snagging, handover)
- **Sprint 8**: Customer Experience (complaints, work orders)
- **Sprint 9**: Reports & Dashboards
- **Sprint 10**: Automation & Integrations
- **Sprint 11**: Testing & QA
- **Sprint 12**: UAT, Deployment, Training

---

## APPENDIX: KEY INTEGRATION PATTERNS

### Webhook Implementation Example

```typescript
// Webhook receiver for Salesforce integration
app.post('/webhooks/salesforce', async (req, res) => {
  const { event, data } = req.body;
  
  switch(event) {
    case 'lead.created':
      await createLocalLead(data);
      break;
    case 'opportunity.updated':
      await syncOpportunity(data);
      break;
    default:
      console.log('Unhandled event:', event);
  }
  
  res.status(200).json({ received: true });
});
```

### Event-Driven Architecture

```typescript
// Event bus for real-time updates
class EventBus {
  private subscribers: Map<string, Function[]> = new Map();
  
  publish(event: string, data: any) {
    const handlers = this.subscribers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
  
  subscribe(event: string, handler: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(handler);
  }
}

// Usage
const bus = new EventBus();
bus.subscribe('lead.converted', (lead) => {
  sendWelcomeEmail(lead);
  createCustomer(lead);
});
bus.publish('lead.converted', leadData);
```

---

**END OF DOCUMENT**

---

*This is a conceptual/illustrative architecture document (component sketches, not production code). It references an "enterprise schema" at a conceptual level; the schema itself is not included here. See `docs/architecture-review.md` before treating this as a build plan.*
