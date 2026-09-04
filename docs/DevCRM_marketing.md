This implementation transforms the current static DevCRM customer page into a modern marketing-oriented CRM with:

Component	Description	Priority
Customer Data Platform (CDP)	Unified, real-time customer profiles from all touchpoints	P0
360-Degree Customer View	Visual dashboard with KYC ring, health score, engagement heatmap	P0
Omnichannel Marketing Engine	Email, SMS, WhatsApp, push notification capabilities	P1
Journey Orchestration	Visual journey builder with multi-stage automation	P1
AI-Powered Features	Content generation, lead scoring, optimal timing	P2
Segmentation Engine	Dynamic, behavioral, predictive segmentation	P1
Analytics Dashboard	Campaign performance, engagement metrics, ROI	P2
1.2 Tech Stack
Layer	Technology	Purpose
Backend	Node.js / Python (Django/Flask)	API services, business logic
Frontend	React / Vue.js / Angular	UI components
Database	PostgreSQL / SQL Server	Primary data store
Cache	Redis	Session management, real-time updates
Message Queue	RabbitMQ / Azure Service Bus	Asynchronous processing
Search	Elasticsearch	Client search, segmentation
Analytics	Power BI / Tableau	Reporting
Email	SendGrid / Mailgun / Azure Communication Services	Email delivery
SMS/WhatsApp	Twilio / Vonage / Azure Communication Services	Messaging
AI	Azure OpenAI / OpenAI API	Content generation, predictions
CDP	Custom / Segment / Customer.io	Customer data unification
1.3 Key Assumptions
DevCRM is the system of record for customer data

All marketing data flows into DevCRM as the source of truth

Real-time updates for high-value touchpoints (sales, support, property views)

Batch processing for analytics and reporting

GDPR/CCPA compliance is built into all data flows

2. Architecture Overview
2.1 High-Level Architecture
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MARKETING CRM ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PRESENTATION LAYER                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │   │
│  │  │ 360 View  │  │ Dashboard│  │ Journey  │  │ Segment Builder   │ │   │
│  │  │ Page      │  │          │  │ Builder  │  │                    │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │   │
│  │  │  REST    │  │ GraphQL  │  │ Webhooks │  │  Event Bus         │ │   │
│  │  │  APIs    │  │          │  │          │  │                    │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SERVICE LAYER                               │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │   │
│  │  │   CDP    │  │ Journey  │  │ Segment  │  │  Campaign          │ │   │
│  │  │  Service │  │ Service  │  │ Service  │  │  Service           │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │   │
│  │  │   AI     │  │ Channel  │  │Analytics │  │  Webhook           │ │   │
│  │  │  Service │  │ Service  │  │ Service  │  │  Service           │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER                                  │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │   │
│  │  │ PostgreSQL│ │    Redis │  │Elastic- │  │  Data Warehouse    │ │   │
│  │  │ (Primary) │ │  (Cache) │  │ search  │  │                    │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      EXTERNAL INTEGRATIONS                          │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │   │
│  │  │ SendGrid │  │  Twilio  │  │Power BI  │  │  Azure OpenAI      │ │   │
│  │  │ Email    │  │ SMS/WA   │  │ Analytics│  │  AI Services        │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
2.2 Data Flow Patterns
Pattern	Description	Use Cases
Event-Driven	Real-time updates via message queue	Client actions (view, click, open)
Scheduled Batch	Daily/weekly sync	Analytics, reporting, segment updates
API-Driven	Synchronous requests	CRUD operations, real-time queries
Webhook	External system notifications	Email opens, SMS replies, survey responses
3. Database Schema & New Tables
3.1 Complete ER Diagram
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MARKETING CRM DATABASE SCHEMA                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CUSTOMER (Existing - Extended)                                     │   │
│  │  ────────────────────────────────────────────────────────────────── │   │
│  │  id              UUID          PK                                   │   │
│  │  customer_id     VARCHAR(50)   UK  (BC Number)                     │   │
│  │  first_name      VARCHAR(100)                                       │   │
│  │  last_name       VARCHAR(100)                                       │   │
│  │  email           VARCHAR(255)  UK                                   │   │
│  │  phone           VARCHAR(20)                                       │   │
│  │  kyc_status      ENUM('Submitted','Verified','Approved','Rejected')│   │
│  │  master_status   ENUM(...)    (Existing)                           │   │
│  │  consent         BOOLEAN                                            │   │
│  │  preferred_channel ENUM('Email','SMS','WhatsApp','Phone')          │   │
│  │  engagement_score DECIMAL(5,2)                                     │   │
│  │  sentiment       ENUM('Positive','Neutral','Negative')             │   │
│  │  created_at      TIMESTAMP                                          │   │
│  │  updated_at      TIMESTAMP                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│  ┌──────────────────┐  ┌─────────┴──────────┐  ┌────────────────────────┐ │
│  │ PROPERTY         │  │ CUSTOMER_SEGMENT   │  │ CUSTOMER_JOURNEY      │ │
│  │ (Existing)       │  │ (NEW)              │  │ (NEW)                  │ │
│  │ ─────────────────│  │ ───────────────────│  │ ──────────────────────│ │
│  │ id               │  │ id                 │  │ id                     │ │
│  │ customer_id (FK) │  │ name               │  │ customer_id (FK)       │ │
│  │ unit_id          │  │ description        │  │ journey_id (FK)        │ │
│  │ ...              │  │ criteria (JSON)    │  │ current_step (FK)      │ │
│  │                  │  │ is_dynamic         │  │ entered_at             │ │
│  │                  │  │ last_computed_at   │  │ last_activity_at       │ │
│  │                  │  │ member_count       │  │ status                 │ │
│  │                  │  │ created_at         │  │ exit_reason            │ │
│  │                  │  └────────────────────┘  └────────────────────────┘ │
│  └──────────────────┘                    │                                │
│                                           │                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ JOURNEY          │  │ JOURNEY_STEP     │  │ JOURNEY_TRIGGER       │ │
│  │ (NEW)            │  │ (NEW)            │  │ (NEW)                  │ │
│  │ ─────────────────│  │ ─────────────────│  │ ──────────────────────│ │
│  │ id               │  │ id               │  │ id                     │ │
│  │ name             │  │ journey_id (FK)  │  │ journey_id (FK)        │ │
│  │ description      │  │ step_order       │  │ event_type             │ │
│  │ config (JSON)    │  │ name             │  │ condition (JSON)       │ │
│  │ status           │  │ action_type      │  │ created_at             │ │
│  │ created_by       │  │ action_config    │  └────────────────────────┘ │
│  │ created_at       │  │ wait_time        │                            │
│  │ updated_at       │  │ condition (JSON) │                            │
│  └──────────────────┘  └──────────────────┘                            │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ CAMPAIGN         │  │ MESSAGE          │  │ ENGAGEMENT_EVENT      │ │
│  │ (NEW)            │  │ (NEW)            │  │ (NEW)                  │ │
│  │ ─────────────────│  │ ─────────────────│  │ ──────────────────────│ │
│  │ id               │  │ id               │  │ id                     │ │
│  │ name             │  │ customer_id (FK) │  │ customer_id (FK)       │ │
│  │ type             │  │ campaign_id (FK) │  │ event_type             │ │
│  │ segment_id (FK)  │  │ journey_id (FK)  │  │ channel                │ │
│  │ objective        │  │ channel          │  │ timestamp              │ │
│  │ budget           │  │ template_id      │  │ source                 │ │
│  │ status           │  │ content (JSON)   │  │ metadata (JSON)        │ │
│  │ start_date       │  │ sent_at          │  │ session_id             │ │
│  │ end_date         │  │ delivered_at     │  │ device_info            │ │
│  │ roi              │  │ opened_at        │  │ created_at             │ │
│  │ created_at       │  │ clicked_at       │  └────────────────────────┘ │
│  └──────────────────┘  │ replied_at       │                            │
│                        │ status           │                            │
│  ┌──────────────────┐  └──────────────────┘                            │
│  │ MESSAGE_TEMPLATE │                    │                              │
│  │ (NEW)            │  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ ─────────────────│  │ SEGMENT_MEMBER   │  │ LEAD_SCORE            │ │
│  │ id               │  │ (NEW)            │  │ (NEW)                  │ │
│  │ name             │  │ ─────────────────│  │ ──────────────────────│ │
│  │ type             │  │ id               │  │ id                     │ │
│  │ subject          │  │ segment_id (FK)  │  │ customer_id (FK)       │ │
│  │ body (HTML)      │  │ customer_id (FK) │  │ score                  │ │
│  │ variables (JSON) │  │ added_at         │  │ last_calculated_at     │ │
│  │ created_at       │  │ manually_added   │  │ factors (JSON)         │ │
│  │ updated_at       │  └──────────────────┘  └────────────────────────┘ │
│  └──────────────────┘                                                  │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ AI_CONTENT_LOG   │  │ A/B_TEST         │  │ LEAD                   │ │
│  │ (NEW)            │  │ (NEW)            │  │ (Existing)             │ │
│  │ ─────────────────│  │ ─────────────────│  │ ──────────────────────│ │
│  │ id               │  │ id               │  │ id                     │ │
│  │ customer_id (FK) │  │ campaign_id (FK) │  │ customer_id (FK)       │ │
│  │ campaign_id (FK) │  │ variant_a        │  │ status                 │ │
│  │ content_type     │  │ variant_b        │  │ score                  │ │
│  │ prompt_used (JSON)│  │ winner          │  │ ...                    │ │
│  │ output           │  │ sample_size     │  └────────────────────────┘ │
│  │ approved         │  │ confidence      │                            │
│  │ feedback (JSON)  │  │ created_at      │                            │
│  │ created_at       │  └──────────────────┘                            │
│  └──────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
3.2 Detailed Table Specifications
3.2.1 Customer Table Extensions
File: migrations/XXXX_add_marketing_fields_to_customer.sql

sql
-- Add marketing fields to existing customer table
ALTER TABLE customers ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'Submitted';
ALTER TABLE customers ADD COLUMN consent BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN preferred_channel VARCHAR(20) DEFAULT 'Email';
ALTER TABLE customers ADD COLUMN engagement_score DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN sentiment VARCHAR(20) DEFAULT 'Neutral';
ALTER TABLE customers ADD COLUMN sentiment_score DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN last_marketing_contact TIMESTAMP;
ALTER TABLE customers ADD COLUMN opt_out_email BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN opt_out_sms BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN opt_out_whatsapp BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN marketing_segments JSON DEFAULT '[]';

-- Create indexes for performance
CREATE INDEX idx_customers_kyc_status ON customers(kyc_status);
CREATE INDEX idx_customers_consent ON customers(consent);
CREATE INDEX idx_customers_engagement_score ON customers(engagement_score);
3.2.2 Customer Segment Table
File: models/CustomerSegment.js

javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomerSegment = sequelize.define('CustomerSegment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    criteria: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    is_dynamic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_computed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    member_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'customer_segments',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });

  CustomerSegment.associate = (models) => {
    CustomerSegment.belongsToMany(models.Customer, {
      through: 'segment_members',
      foreignKey: 'segment_id',
      otherKey: 'customer_id'
    });
    CustomerSegment.hasMany(models.Campaign, {
      foreignKey: 'segment_id'
    });
  };

  return CustomerSegment;
};
3.2.3 Journey Table
File: models/Journey.js

javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Journey = sequelize.define('Journey', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        entry_criteria: {},
        exit_criteria: {},
        trigger_event: null,
        segment_target: null
      }
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Active', 'Paused', 'Archived'),
      defaultValue: 'Draft'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'journeys',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });

  Journey.associate = (models) => {
    Journey.hasMany(models.JourneyStep, {
      foreignKey: 'journey_id',
      as: 'steps'
    });
    Journey.hasMany(models.JourneyTrigger, {
      foreignKey: 'journey_id',
      as: 'triggers'
    });
    Journey.hasMany(models.CustomerJourney, {
      foreignKey: 'journey_id'
    });
    Journey.hasMany(models.Campaign, {
      foreignKey: 'journey_id'
    });
  };

  return Journey;
};
3.2.4 Journey Step Table
File: models/JourneyStep.js

javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JourneyStep = sequelize.define('JourneyStep', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    journey_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'journeys', key: 'id' },
      onDelete: 'CASCADE'
    },
    step_order: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    action_type: {
      type: DataTypes.ENUM(
        'SendEmail',
        'SendSMS',
        'SendWhatsApp',
        'Wait',
        'Conditional',
        'UpdateAttribute',
        'AddToSegment',
        'RemoveFromSegment',
        'CreateTask',
        'Webhook'
      ),
      allowNull: false
    },
    action_config: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    wait_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Wait time in hours'
    },
    condition: {
      type: DataTypes.JSON,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'journey_steps',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });

  JourneyStep.associate = (models) => {
    JourneyStep.belongsTo(models.Journey, {
      foreignKey: 'journey_id',
      as: 'journey'
    });
    JourneyStep.hasMany(models.CustomerJourneyStep, {
      foreignKey: 'step_id',
      as: 'customer_steps'
    });
  };

  return JourneyStep;
};
3.2.5 Message Table
File: models/Message.js

javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'customers', key: 'id' },
      onDelete: 'CASCADE'
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'campaigns', key: 'id' }
    },
    journey_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'journeys', key: 'id' }
    },
    channel: {
      type: DataTypes.ENUM('Email', 'SMS', 'WhatsApp', 'WebPush', 'InApp'),
      allowNull: false
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'message_templates', key: 'id' }
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clicked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    replied_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    bounced_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'Draft',
        'Pending',
        'Sent',
        'Delivered',
        'Opened',
        'Clicked',
        'Replied',
        'Bounced',
        'Failed'
      ),
      defaultValue: 'Draft'
    },
    provider_message_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    provider_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });

  Message.associate = (models) => {
    Message.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
    Message.belongsTo(models.Campaign, {
      foreignKey: 'campaign_id'
    });
    Message.belongsTo(models.Journey, {
      foreignKey: 'journey_id'
    });
    Message.belongsTo(models.MessageTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });
  };

  return Message;
};
3.2.6 Engagement Event Table
File: models/EngagementEvent.js

javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EngagementEvent = sequelize.define('EngagementEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'customers', key: 'id' },
      onDelete: 'CASCADE'
    },
    event_type: {
      type: DataTypes.ENUM(
        'PageView',
        'PropertyView',
        'BrochureDownload',
        'InquirySubmit',
        'EmailOpen',
        'EmailClick',
        'SMSOpen',
        'SMSReply',
        'WhatsAppOpen',
        'WhatsAppReply',
        'SiteVisitRequest',
        'SiteVisitAttended',
        'PaymentMade',
        'ComplaintSubmitted',
        'ReferralMade',
        'PortalLogin'
      ),
      allowNull: false
    },
    channel: {
      type: DataTypes.ENUM('Web', 'Mobile', 'Email', 'SMS', 'WhatsApp', 'InPerson'),
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    session_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'engagement_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  EngagementEvent.associate = (models) => {
    EngagementEvent.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
  };

  // Indexes for performance
  EngagementEvent.addHook('afterSync', async (options) => {
    const query = options.sequelize.getQueryInterface();
    await query.addIndex('engagement_events', ['customer_id', 'timestamp']);
    await query.addIndex('engagement_events', ['event_type', 'timestamp']);
    await query.addIndex('engagement_events', ['customer_id', 'event_type']);
  });

  return EngagementEvent;
};
3.2.7 AI Content Log Table
File: models/AIContentLog.js

javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AIContentLog = sequelize.define('AIContentLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'customers', key: 'id' }
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'campaigns', key: 'id' }
    },
    content_type: {
      type: DataTypes.ENUM('EmailSubject', 'EmailBody', 'SMSContent', 'WhatsAppContent', 'PropertyDescription'),
      allowNull: false
    },
    prompt_used: {
      type: DataTypes.JSON,
      allowNull: false
    },
    output: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    feedback: {
      type: DataTypes.JSON,
      allowNull: true
    },
    processed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ai_content_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  AIContentLog.associate = (models) => {
    AIContentLog.belongsTo(models.Customer, {
      foreignKey: 'customer_id'
    });
    AIContentLog.belongsTo(models.Campaign, {
      foreignKey: 'campaign_id'
    });
  };

  return AIContentLog;
};
3.3 Migration Order
bash
# Run migrations in this order:
1. migrations/001_add_marketing_fields_to_customer.sql
2. migrations/002_create_customer_segments.sql
3. migrations/003_create_message_templates.sql
4. migrations/004_create_journeys.sql
5. migrations/005_create_journey_steps.sql
6. migrations/006_create_customer_journeys.sql
7. migrations/007_create_customer_journey_steps.sql
8. migrations/008_create_campaigns.sql
9. migrations/009_create_messages.sql
10. migrations/010_create_engagement_events.sql
11. migrations/011_create_ai_content_logs.sql
12. migrations/012_create_segment_members.sql
13. migrations/013_create_journey_triggers.sql
14. migrations/014_create_ab_tests.sql
15. migrations/015_create_lead_scores.sql
4. Customer Data Platform (CDP) Implementation
4.1 CDP Service Architecture
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CDP SERVICE ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DATA INGESTION LAYER                          │   │
│  │                                                                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │   │
│  │  │  DevCRM    │  │  Website   │  │  Email/SMS │  │ 3rd Party  │  │   │
│  │  │  Events    │  │  Analytics │  │  Events    │  │  APIs      │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │   │
│  │       │               │               │               │           │   │
│  │       ▼               ▼               ▼               ▼           │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                    EVENT BUS (RabbitMQ)                    │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       PROCESSING LAYER                              │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                    CDP PROCESSOR                            │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │  │   │
│  │  │  │ Identity    │  │ Data        │  │ Event Enrichment    │ │  │   │
│  │  │  │ Resolution  │→│ Cleanse     │→│ & Aggregation       │ │  │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       STORAGE LAYER                                 │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                  UNIFIED CUSTOMER PROFILE                   │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │  │   │
│  │  │  │ PostgreSQL  │  │  Redis      │  │ Elasticsearch       │ │  │   │
│  │  │  │ (Primary)   │  │  (Cache)    │  │ (Search/Segments)   │ │  │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
4.2 CDP Service Implementation
File: services/CDPService.js

javascript
const { Customer, EngagementEvent, Message, Transaction, Complaint } = require('../models');
const Redis = require('ioredis');
const { EventEmitter } = require('events');

class CDPService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.eventBus = new EventEmitter();
    this.setupEventListeners();
  }

  /**
   * Get unified customer profile
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Unified profile
   */
  async getUnifiedProfile(customerId) {
    // Check cache first
    const cacheKey = `cdp:profile:${customerId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch data from all sources
    const [
      customer,
      events,
      messages,
      transactions,
      complaints
    ] = await Promise.all([
      Customer.findByPk(customerId),
      EngagementEvent.findAll({
        where: { customer_id: customerId },
        order: [['timestamp', 'DESC']],
        limit: 100
      }),
      Message.findAll({
        where: { customer_id: customerId },
        order: [['sent_at', 'DESC']],
        limit: 50
      }),
      Transaction.findAll({
        where: { customer_id: customerId },
        order: [['created_at', 'DESC']]
      }),
      Complaint.findAll({
        where: { customer_id: customerId },
        order: [['created_at', 'DESC']]
      })
    ]);

    // Build unified profile
    const profile = {
      id: customer.id,
      customer_id: customer.customer_id,
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      kyc_status: customer.kyc_status,
      master_status: customer.master_status,
      preferred_channel: customer.preferred_channel,
      engagement_score: customer.engagement_score,
      sentiment: customer.sentiment,
      consent: customer.consent,
      
      // Aggregated data
      summary: {
        total_properties: await this.getPropertyCount(customerId),
        total_transactions: transactions.length,
        total_complaints: complaints.length,
        total_messages: messages.length,
        total_events: events.length
      },
      
      // Recent activity (last 30 days)
      recent_activity: {
        messages: messages.filter(m => 
          new Date(m.sent_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ),
        events: events.filter(e => 
          new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
      },
      
      // Engagement metrics
      engagement: {
        score: customer.engagement_score,
        last_contact: customer.last_marketing_contact,
        open_rate: this.calculateOpenRate(messages),
        click_rate: this.calculateClickRate(messages),
        reply_rate: this.calculateReplyRate(messages)
      },
      
      // Financial summary
      financial: {
        total_paid: transactions.reduce((sum, t) => sum + t.amount, 0),
        total_outstanding: this.calculateOutstanding(transactions),
        payment_status: this.determinePaymentStatus(transactions)
      },
      
      // Next best action
      next_best_action: await this.calculateNextBestAction(customerId)
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(profile));

    return profile;
  }

  /**
   * Ingest event from any source
   * @param {Object} eventData - Event data
   * @returns {Promise<void>}
   */
  async ingestEvent(eventData) {
    const {
      customerId,
      eventType,
      channel,
      source,
      metadata,
      timestamp = new Date()
    } = eventData;

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Save engagement event
    const event = await EngagementEvent.create({
      customer_id: customerId,
      event_type: eventType,
      channel,
      source,
      metadata,
      timestamp,
      session_id: metadata?.sessionId,
      device_info: metadata?.deviceInfo
    });

    // Update customer engagement score
    await this.updateEngagementScore(customerId);

    // Trigger journey events
    this.eventBus.emit('engagement', {
      customerId,
      eventType,
      event,
      customer
    });

    // Invalidate cache
    await this.redis.del(`cdp:profile:${customerId}`);
    await this.redis.del(`cdp:segments:${customerId}`);

    return event;
  }

  /**
   * Update engagement score for customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<number>} New score
   */
  async updateEngagementScore(customerId) {
    const events = await EngagementEvent.findAll({
      where: { customer_id: customerId },
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    const messages = await Message.findAll({
      where: { customer_id: customerId },
      order: [['sent_at', 'DESC']],
      limit: 50
    });

    let score = 0;
    const now = new Date();

    // Recency (max 40 points)
    const lastEvent = events[0];
    if (lastEvent) {
      const daysSince = (now - new Date(lastEvent.timestamp)) / (1000 * 60 * 60 * 24);
      if (daysSince <= 2) score += 40;
      else if (daysSince <= 7) score += 30;
      else if (daysSince <= 14) score += 20;
      else if (daysSince <= 30) score += 10;
    }

    // Frequency (max 30 points)
    const recentEvents = events.filter(e => 
      new Date(e.timestamp) > new Date(now - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentEvents.length >= 10) score += 30;
    else if (recentEvents.length >= 5) score += 20;
    else if (recentEvents.length >= 3) score += 10;

    // Engagement depth (max 30 points)
    const opens = messages.filter(m => m.opened_at).length;
    const clicks = messages.filter(m => m.clicked_at).length;
    const replies = messages.filter(m => m.replied_at).length;
    
    if (replies > 0) score += 30;
    else if (clicks > 5) score += 20;
    else if (opens > 10) score += 10;

    // Update customer
    await Customer.update(
      { engagement_score: score },
      { where: { id: customerId } }
    );

    return score;
  }

  /**
   * Calculate next best action for customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Next best action
   */
  async calculateNextBestAction(customerId) {
    const customer = await Customer.findByPk(customerId);
    const events = await EngagementEvent.findAll({
      where: { customer_id: customerId },
      order: [['timestamp', 'DESC']],
      limit: 50
    });

    const lastEvent = events[0];
    const daysSince = lastEvent ? (Date.now() - new Date(lastEvent.timestamp)) / (1000 * 60 * 60 * 24) : 999;

    // Rule-based next best action
    if (daysSince > 30) {
      return {
        action: 'RE_ENGAGE',
        reason: 'No engagement in 30+ days',
        channel: customer.preferred_channel || 'Email',
        urgency: 'High'
      };
    }

    if (customer.master_status === 'SPA Executed' || customer.master_status === 'Handover Ready') {
      const daysUntilHandover = this.calculateDaysUntilHandover(customerId);
      if (daysUntilHandover <= 30 && daysUntilHandover > 0) {
        return {
          action: 'HANDOVER_PREP',
          reason: `${daysUntilHandover} days until handover`,
          channel: 'WhatsApp',
          urgency: 'High'
        };
      }
    }

    if (this.hasOverduePayment(customerId)) {
      return {
        action: 'PAYMENT_REMINDER',
        reason: 'Overdue payment detected',
        channel: 'SMS',
        urgency: 'Critical'
      };
    }

    // Default: nurture
    return {
      action: 'NURTURE',
      reason: 'Regular engagement',
      channel: customer.preferred_channel || 'Email',
      urgency: 'Low'
    };
  }

  // Helper methods
  calculateOpenRate(messages) {
    const sent = messages.filter(m => m.sent_at).length;
    const opened = messages.filter(m => m.opened_at).length;
    return sent > 0 ? (opened / sent) * 100 : 0;
  }

  calculateClickRate(messages) {
    const opened = messages.filter(m => m.opened_at).length;
    const clicked = messages.filter(m => m.clicked_at).length;
    return opened > 0 ? (clicked / opened) * 100 : 0;
  }

  calculateReplyRate(messages) {
    const sent = messages.filter(m => m.sent_at).length;
    const replied = messages.filter(m => m.replied_at).length;
    return sent > 0 ? (replied / sent) * 100 : 0;
  }

  calculateOutstanding(transactions) {
    // Implementation depends on payment schedule
    return 0;
  }

  determinePaymentStatus(transactions) {
    // Implementation depends on payment schedule
    return 'Current';
  }

  hasOverduePayment(customerId) {
    // Implementation depends on payment schedule
    return false;
  }

  calculateDaysUntilHandover(customerId) {
    // Implementation depends on property data
    return 0;
  }

  async getPropertyCount(customerId) {
    // Implementation depends on property model
    return 0;
  }

  setupEventListeners() {
    this.eventBus.on('engagement', async ({ customerId, eventType, event, customer }) => {
      // Trigger journeys
      // Update segments
      // Update scoring
      console.log(`Event processed for ${customerId}: ${eventType}`);
    });
  }
}

module.exports = new CDPService();
4.3 CDP API Routes
File: routes/cdp.js

javascript
const express = require('express');
const router = express.Router();
const CDPService = require('../services/CDPService');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /api/cdp/profile/:customerId
 * Get unified customer profile
 */
router.get('/profile/:customerId', authenticate, async (req, res) => {
  try {
    const profile = await CDPService.getUnifiedProfile(req.params.customerId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/cdp/event
 * Ingest an event
 */
router.post('/event', authenticate, async (req, res) => {
  try {
    const event = await CDPService.ingestEvent(req.body);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cdp/engagement/:customerId
 * Get engagement data for customer
 */
router.get('/engagement/:customerId', authenticate, async (req, res) => {
  try {
    const data = await CDPService.getEngagementData(req.params.customerId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/cdp/sync
 * Manual sync of customer data
 */
router.post('/sync', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await CDPService.syncAllCustomers();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
5. Omnichannel Integration Specifications
5.1 Channel Service Architecture
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OMNICHANNEL SERVICE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CHANNEL SERVICE LAYER                          │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │   Email     │  │    SMS      │  │  WhatsApp   │  │ Web Push  │  │   │
│  │  │  Service    │  │  Service    │  │  Service    │  │ Service   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PROVIDER INTEGRATIONS                            │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │  │  SendGrid   │  │   Twilio    │  │ Twilio WA   │                │   │
│  │  │  (Email)    │  │   (SMS)     │  │  Business   │                │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  │                                                                     │   │
│  │  Alternative: Azure Communication Services (Unified)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
5.2 Email Service Implementation
File: services/channels/EmailService.js

javascript
const sgMail = require('@sendgrid/mail');
const { Message, MessageTemplate } = require('../../models');

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
  }

  /**
   * Send email to customer
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(params) {
    const {
      customer,
      subject,
      body,
      templateId,
      templateData,
      attachments = [],
      scheduledAt = null
    } = params;

    // Prepare email content
    let htmlBody = body;
    let emailSubject = subject;

    // Use template if provided
    if (templateId) {
      const template = await MessageTemplate.findByPk(templateId);
      if (template) {
        emailSubject = this.renderTemplate(template.subject, templateData);
        htmlBody = this.renderTemplate(template.body_html, templateData);
      }
    }

    // Create message record
    const message = await Message.create({
      customer_id: customer.id,
      channel: 'Email',
      content: { subject: emailSubject, body: htmlBody },
      subject: emailSubject,
      status: 'Pending'
    });

    // Prepare SendGrid payload
    const msg = {
      to: customer.email,
      from: this.fromEmail,
      subject: emailSubject,
      html: htmlBody,
      attachments: attachments.map(a => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: a.disposition || 'attachment'
      })),
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
        subscription_tracking: { enable: true }
      }
    };

    // Add scheduling if provided
    if (scheduledAt) {
      msg.send_at = Math.floor(new Date(scheduledAt).getTime() / 1000);
    }

    try {
      const response = await sgMail.send(msg);
      
      // Update message record
      await message.update({
        status: 'Sent',
        sent_at: new Date(),
        provider_message_id: response[0]?.headers['x-message-id'],
        provider_data: { response: response[0] }
      });

      // Track event
      await this.trackEngagement(message, 'sent');

      return { success: true, messageId: message.id, providerId: response[0]?.headers['x-message-id'] };
    } catch (error) {
      await message.update({ status: 'Failed', provider_data: { error: error.message } });
      throw error;
    }
  }

  /**
   * Handle email webhook events
   * @param {Object} eventData - Webhook payload
   * @returns {Promise<void>}
   */
  async handleWebhook(eventData) {
    const { event, email, message_id, timestamp } = eventData;

    // Find message by provider ID
    const message = await Message.findOne({
      where: { provider_message_id: message_id }
    });

    if (!message) {
      console.warn(`Message not found for provider ID: ${message_id}`);
      return;
    }

    // Update message based on event
    switch (event) {
      case 'delivered':
        await message.update({ status: 'Delivered', delivered_at: new Date(timestamp) });
        await this.trackEngagement(message, 'delivered');
        break;
      
      case 'open':
        await message.update({ status: 'Opened', opened_at: new Date(timestamp) });
        await this.trackEngagement(message, 'opened');
        break;
      
      case 'click':
        await message.update({ status: 'Clicked', clicked_at: new Date(timestamp) });
        await this.trackEngagement(message, 'clicked');
        break;
      
      case 'bounce':
        await message.update({ status: 'Bounced', bounced_at: new Date(timestamp) });
        await this.trackEngagement(message, 'bounced');
        break;
      
      case 'dropped':
        await message.update({ status: 'Failed' });
        break;
      
      case 'spamreport':
        await message.update({ status: 'Failed' });
        break;
      
      default:
        console.log(`Unhandled event: ${event}`);
    }
  }

  /**
   * Track engagement event
   * @param {Message} message - Message record
   * @param {string} eventType - Event type
   * @returns {Promise<void>}
   */
  async trackEngagement(message, eventType) {
    const { EngagementEvent, CDPService } = require('../../models');
    
    await EngagementEvent.create({
      customer_id: message.customer_id,
      event_type: `Email${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
      channel: 'Email',
      source: 'SendGrid',
      metadata: {
        message_id: message.id,
        subject: message.subject,
        campaign_id: message.campaign_id,
        journey_id: message.journey_id
      }
    });

    // Update CDP
    await CDPService.updateEngagementScore(message.customer_id);
  }

  /**
   * Render template with data
   * @param {string} template - Template string
   * @param {Object} data - Template data
   * @returns {string} Rendered template
   */
  renderTemplate(template, data) {
    if (!data) return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
}

module.exports = new EmailService();
5.3 SMS Service Implementation
File: services/channels/SMSService.js

javascript
const twilio = require('twilio');
const { Message, MessageTemplate } = require('../../models');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;
  }

  /**
   * Send SMS to customer
   * @param {Object} params - SMS parameters
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(params) {
    const {
      customer,
      body,
      templateId,
      templateData,
      scheduledAt = null
    } = params;

    let messageBody = body;

    // Use template if provided
    if (templateId) {
      const template = await MessageTemplate.findByPk(templateId);
      if (template) {
        messageBody = this.renderTemplate(template.body_text, templateData);
      }
    }

    // Create message record
    const message = await Message.create({
      customer_id: customer.id,
      channel: 'SMS',
      content: { body: messageBody },
      status: 'Pending'
    });

    // Prepare Twilio payload
    const payload = {
      body: messageBody,
      from: this.fromNumber,
      to: customer.phone,
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
    };

    // Add scheduling if provided
    if (scheduledAt) {
      payload.sendAt = new Date(scheduledAt);
    }

    try {
      const response = await this.client.messages.create(payload);
      
      // Update message record
      await message.update({
        status: 'Sent',
        sent_at: new Date(),
        provider_message_id: response.sid,
        provider_data: { status: response.status }
      });

      // Track event
      await this.trackEngagement(message, 'sent');

      return { success: true, messageId: message.id, providerId: response.sid };
    } catch (error) {
      await message.update({ status: 'Failed', provider_data: { error: error.message } });
      throw error;
    }
  }

  /**
   * Handle SMS webhook events
   * @param {Object} eventData - Webhook payload
   * @returns {Promise<void>}
   */
  async handleWebhook(eventData) {
    const { MessageSid, MessageStatus, To, Body, From } = eventData;

    // Find message by provider ID
    const message = await Message.findOne({
      where: { provider_message_id: MessageSid }
    });

    if (!message) {
      console.warn(`Message not found for provider ID: ${MessageSid}`);
      return;
    }

    // Update message based on status
    switch (MessageStatus) {
      case 'sent':
      case 'delivered':
        await message.update({ 
          status: 'Delivered', 
          delivered_at: new Date()
        });
        await this.trackEngagement(message, 'delivered');
        break;
      
      case 'read':
        await message.update({ 
          status: 'Opened', 
          opened_at: new Date()
        });
        await this.trackEngagement(message, 'opened');
        break;
      
      case 'received':
        // Incoming SMS
        await message.update({ 
          status: 'Replied', 
          replied_at: new Date()
        });
        await this.trackEngagement(message, 'replied');
        
        // Log incoming message as engagement event
        const { EngagementEvent } = require('../../models');
        await EngagementEvent.create({
          customer_id: message.customer_id,
          event_type: 'SMSReply',
          channel: 'SMS',
          source: 'Twilio',
          metadata: {
            message_id: message.id,
            body: Body,
            from: From
          }
        });
        break;
      
      case 'undelivered':
      case 'failed':
        await message.update({ status: 'Failed' });
        break;
      
      default:
        console.log(`Unhandled status: ${MessageStatus}`);
    }
  }

  /**
   * Track engagement event
   * @param {Message} message - Message record
   * @param {string} eventType - Event type
   * @returns {Promise<void>}
   */
  async trackEngagement(message, eventType) {
    const { EngagementEvent, CDPService } = require('../../models');
    
    await EngagementEvent.create({
      customer_id: message.customer_id,
      event_type: `SMS${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
      channel: 'SMS',
      source: 'Twilio',
      metadata: {
        message_id: message.id,
        body: message.content.body,
        campaign_id: message.campaign_id,
        journey_id: message.journey_id
      }
    });

    // Update CDP
    await CDPService.updateEngagementScore(message.customer_id);
  }

  /**
   * Render template with data
   * @param {string} template - Template string
   * @param {Object} data - Template data
   * @returns {string} Rendered template
   */
  renderTemplate(template, data) {
    if (!data) return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
}

module.exports = new SMSService();
5.4 WhatsApp Service Implementation
File: services/channels/WhatsAppService.js

javascript
const { Client, LocalAuth } = require('whatsapp-web.js');
const twilio = require('twilio');
const { Message, MessageTemplate } = require('../../models');

class WhatsAppService {
  constructor() {
    // Use Twilio WhatsApp Business API
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.whatsappNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
  }

  /**
   * Send WhatsApp message to customer
   * @param {Object} params - WhatsApp parameters
   * @returns {Promise<Object>} Send result
   */
  async sendWhatsApp(params) {
    const {
      customer,
      body,
      templateId,
      templateData,
      mediaUrl = null,
      scheduledAt = null
    } = params;

    let messageBody = body;

    // Use template if provided
    if (templateId) {
      const template = await MessageTemplate.findByPk(templateId);
      if (template) {
        messageBody = this.renderTemplate(template.body_text, templateData);
      }
    }

    // Create message record
    const message = await Message.create({
      customer_id: customer.id,
      channel: 'WhatsApp',
      content: { body: messageBody, mediaUrl },
      status: 'Pending'
    });

    // Prepare WhatsApp payload
    const payload = {
      body: messageBody,
      from: this.whatsappNumber,
      to: `whatsapp:${customer.phone}`,
      statusCallback: process.env.TWILIO_WHATSAPP_STATUS_CALLBACK_URL
    };

    if (mediaUrl) {
      payload.mediaUrl = [mediaUrl];
    }

    try {
      const response = await this.client.messages.create(payload);
      
      // Update message record
      await message.update({
        status: 'Sent',
        sent_at: new Date(),
        provider_message_id: response.sid,
        provider_data: { status: response.status }
      });

      // Track event
      await this.trackEngagement(message, 'sent');

      return { success: true, messageId: message.id, providerId: response.sid };
    } catch (error) {
      await message.update({ status: 'Failed', provider_data: { error: error.message } });
      throw error;
    }
  }

  /**
   * Send interactive WhatsApp message with buttons
   * @param {Object} params - Interactive message parameters
   * @returns {Promise<Object>} Send result
   */
  async sendInteractiveMessage(params) {
    const {
      customer,
      body,
      buttons,
      header = null,
      footer = null
    } = params;

    // Create message record
    const message = await Message.create({
      customer_id: customer.id,
      channel: 'WhatsApp',
      content: { body, buttons, header, footer },
      status: 'Pending'
    });

    try {
      const response = await this.client.messages.create({
        from: this.whatsappNumber,
        to: `whatsapp:${customer.phone}`,
        body: body,
        buttons: buttons.map((b, i) => ({
          type: 'reply',
          id: `btn_${i}`,
          title: b.text
        })),
        footer: footer
      });

      await message.update({
        status: 'Sent',
        sent_at: new Date(),
        provider_message_id: response.sid
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      await message.update({ status: 'Failed', provider_data: { error: error.message } });
      throw error;
    }
  }

  /**
   * Handle WhatsApp webhook events
   * @param {Object} eventData - Webhook payload
   * @returns {Promise<void>}
   */
  async handleWebhook(eventData) {
    const { MessageSid, MessageStatus, To, Body, From } = eventData;

    // Find message by provider ID
    const message = await Message.findOne({
      where: { provider_message_id: MessageSid }
    });

    if (!message) {
      console.warn(`Message not found for provider ID: ${MessageSid}`);
      return;
    }

    // Update message based on status
    switch (MessageStatus) {
      case 'sent':
      case 'delivered':
        await message.update({ 
          status: 'Delivered', 
          delivered_at: new Date()
        });
        await this.trackEngagement(message, 'delivered');
        break;
      
      case 'read':
        await message.update({ 
          status: 'Opened', 
          opened_at: new Date()
        });
        await this.trackEngagement(message, 'opened');
        break;
      
      case 'received':
        // Incoming WhatsApp message
        await message.update({ 
          status: 'Replied', 
          replied_at: new Date()
        });
        await this.trackEngagement(message, 'replied');
        
        // Log incoming message as engagement event
        const { EngagementEvent } = require('../../models');
        await EngagementEvent.create({
          customer_id: message.customer_id,
          event_type: 'WhatsAppReply',
          channel: 'WhatsApp',
          source: 'Twilio',
          metadata: {
            message_id: message.id,
            body: Body,
            from: From
          }
        });
        break;
      
      default:
        console.log(`Unhandled status: ${MessageStatus}`);
    }
  }

  /**
   * Track engagement event
   * @param {Message} message - Message record
   * @param {string} eventType - Event type
   * @returns {Promise<void>}
   */
  async trackEngagement(message, eventType) {
    const { EngagementEvent, CDPService } = require('../../models');
    
    await EngagementEvent.create({
      customer_id: message.customer_id,
      event_type: `WhatsApp${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
      channel: 'WhatsApp',
      source: 'Twilio',
      metadata: {
        message_id: message.id,
        body: message.content.body,
        campaign_id: message.campaign_id,
        journey_id: message.journey_id
      }
    });

    // Update CDP
    await CDPService.updateEngagementScore(message.customer_id);
  }

  /**
   * Render template with data
   * @param {string} template - Template string
   * @param {Object} data - Template data
   * @returns {string} Rendered template
   */
  renderTemplate(template, data) {
    if (!data) return template;
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
}

module.exports = new WhatsAppService();
5.5 Channel Service Router
File: services/channels/ChannelRouter.js

javascript
const EmailService = require('./EmailService');
const SMSService = require('./SMSService');
const WhatsAppService = require('./WhatsAppService');

class ChannelRouter {
  /**
   * Send message via appropriate channel
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(params) {
    const { channel, customer, ...messageParams } = params;

    switch (channel) {
      case 'Email':
        return EmailService.sendEmail({ customer, ...messageParams });
      
      case 'SMS':
        return SMSService.sendSMS({ customer, ...messageParams });
      
      case 'WhatsApp':
        return WhatsAppService.sendWhatsApp({ customer, ...messageParams });
      
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Handle webhook from any provider
   * @param {string} provider - Provider name (SendGrid, Twilio)
   * @param {Object} payload - Webhook payload
   * @returns {Promise<void>}
   */
  async handleWebhook(provider, payload) {
    switch (provider) {
      case 'SendGrid':
        return EmailService.handleWebhook(payload);
      
      case 'Twilio':
        // Determine channel from payload
        if (payload.From?.startsWith('whatsapp:')) {
          return WhatsAppService.handleWebhook(payload);
        } else {
          return SMSService.handleWebhook(payload);
        }
      
      default:
        console.warn(`Unsupported webhook provider: ${provider}`);
    }
  }

  /**
   * Get channel preferences for customer
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>} Channel preferences
   */
  async getChannelPreferences(customer) {
    return {
      preferred: customer.preferred_channel || 'Email',
      available: {
        Email: !!customer.email,
        SMS: !!customer.phone,
        WhatsApp: !!customer.phone
      },
      optOut: {
        Email: customer.opt_out_email || false,
        SMS: customer.opt_out_sms || false,
        WhatsApp: customer.opt_out_whatsapp || false
      }
    };
  }
}

module.exports = new ChannelRouter();
5.6 Webhook Routes
File: routes/webhooks.js

javascript
const express = require('express');
const router = express.Router();
const ChannelRouter = require('../services/channels/ChannelRouter');

/**
 * POST /webhooks/email/sendgrid
 * SendGrid webhook endpoint
 */
router.post('/email/sendgrid', async (req, res) => {
  try {
    // SendGrid sends an array of events
    const events = Array.isArray(req.body) ? req.body : [req.body];
    
    for (const event of events) {
      await ChannelRouter.handleWebhook('SendGrid', event);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    res.status(500).send('Error');
  }
});

/**
 * POST /webhooks/sms/twilio
 * Twilio SMS/WhatsApp webhook endpoint
 */
router.post('/sms/twilio', async (req, res) => {
  try {
    await ChannelRouter.handleWebhook('Twilio', req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).send('Error');
  }
});

/**
 * POST /webhooks/whatsapp/twilio
 * Twilio WhatsApp webhook endpoint
 */
router.post('/whatsapp/twilio', async (req, res) => {
  try {
    await ChannelRouter.handleWebhook('Twilio', req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).send('Error');
  }
});

/**
 * GET /webhooks/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
6. Journey Orchestration Engine
6.1 Journey Service Implementation
File: services/JourneyService.js

javascript
const { Journey, JourneyStep, CustomerJourney, CustomerJourneyStep, Customer, EngagementEvent } = require('../models');
const ChannelRouter = require('./channels/ChannelRouter');
const CDPService = require('./CDPService');
const { Op } = require('sequelize');

class JourneyService {
  constructor() {
    this.retryInterval = 5 * 60 * 1000; // 5 minutes
    this.startProcessor();
  }

  /**
   * Start journey processor
   */
  startProcessor() {
    setInterval(async () => {
      try {
        await this.processActiveJourneys();
      } catch (error) {
        console.error('Journey processor error:', error);
      }
    }, this.retryInterval);
  }

  /**
   * Process active journeys
   */
  async processActiveJourneys() {
    const journeys = await Journey.findAll({
      where: { status: 'Active' }
    });

    for (const journey of journeys) {
      await this.processJourney(journey);
    }
  }

  /**
   * Process a single journey
   * @param {Journey} journey - Journey object
   */
  async processJourney(journey) {
    // Get steps in order
    const steps = await JourneyStep.findAll({
      where: { journey_id: journey.id },
      order: [['step_order', 'ASC']]
    });

    // Get customers in this journey
    const customerJourneys = await CustomerJourney.findAll({
      where: {
        journey_id: journey.id,
        status: 'Active'
      },
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });

    for (const customerJourney of customerJourneys) {
      await this.processCustomerJourney(customerJourney, steps);
    }
  }

  /**
   * Process a single customer's journey
   * @param {CustomerJourney} customerJourney - Customer journey record
   * @param {Array} steps - Journey steps
   */
  async processCustomerJourney(customerJourney, steps) {
    const customer = customerJourney.customer;
    const currentStepIndex = customerJourney.current_step_index || 0;

    // Check if journey should be exited
    if (await this.shouldExitJourney(customerJourney)) {
      await customerJourney.update({ status: 'Completed', exit_reason: 'Exit criteria met' });
      return;
    }

    // Process current step
    if (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      await this.processStep(customerJourney, step);
    } else {
      // Journey completed
      await customerJourney.update({ status: 'Completed' });
    }
  }

  /**
   * Process a single step
   * @param {CustomerJourney} customerJourney - Customer journey record
   * @param {JourneyStep} step - Journey step
   */
  async processStep(customerJourney, step) {
    const customer = customerJourney.customer;

    // Check if step already processed
    const existingStep = await CustomerJourneyStep.findOne({
      where: {
        customer_journey_id: customerJourney.id,
        step_id: step.id
      }
    });

    if (existingStep && existingStep.status === 'Completed') {
      // Move to next step
      await customerJourney.update({ current_step_index: step.step_order });
      return;
    }

    // Process based on action type
    let result = null;
    switch (step.action_type) {
      case 'SendEmail':
        result = await this.executeSendEmail(step, customer);
        break;
      
      case 'SendSMS':
        result = await this.executeSendSMS(step, customer);
        break;
      
      case 'SendWhatsApp':
        result = await this.executeSendWhatsApp(step, customer);
        break;
      
      case 'Wait':
        result = await this.executeWait(step, customerJourney);
        break;
      
      case 'Conditional':
        result = await this.executeConditional(step, customer);
        break;
      
      case 'UpdateAttribute':
        result = await this.executeUpdateAttribute(step, customer);
        break;
      
      case 'AddToSegment':
        result = await this.executeAddToSegment(step, customer);
        break;
      
      case 'RemoveFromSegment':
        result = await this.executeRemoveFromSegment(step, customer);
        break;
      
      case 'CreateTask':
        result = await this.executeCreateTask(step, customer);
        break;
      
      case 'Webhook':
        result = await this.executeWebhook(step, customer);
        break;
      
      default:
        console.warn(`Unknown action type: ${step.action_type}`);
        return;
    }

    // Record step execution
    await CustomerJourneyStep.create({
      customer_journey_id: customerJourney.id,
      step_id: step.id,
      status: result?.success ? 'Completed' : 'Failed',
      action_result: result,
      processed_at: new Date()
    });

    // If step completed successfully, move to next step
    if (result?.success) {
      await customerJourney.update({ current_step_index: step.step_order + 1 });
    } else {
      await customerJourney.update({ status: 'Paused' });
    }
  }

  /**
   * Execute SendEmail action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeSendEmail(step, customer) {
    const config = step.action_config;
    return ChannelRouter.sendMessage({
      channel: 'Email',
      customer,
      templateId: config.templateId,
      templateData: config.templateData || {},
      scheduledAt: config.scheduledAt || null
    });
  }

  /**
   * Execute SendSMS action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeSendSMS(step, customer) {
    const config = step.action_config;
    return ChannelRouter.sendMessage({
      channel: 'SMS',
      customer,
      templateId: config.templateId,
      templateData: config.templateData || {},
      scheduledAt: config.scheduledAt || null
    });
  }

  /**
   * Execute SendWhatsApp action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeSendWhatsApp(step, customer) {
    const config = step.action_config;
    return ChannelRouter.sendMessage({
      channel: 'WhatsApp',
      customer,
      templateId: config.templateId,
      templateData: config.templateData || {},
      scheduledAt: config.scheduledAt || null
    });
  }

  /**
   * Execute Wait action
   * @param {JourneyStep} step - Journey step
   * @param {CustomerJourney} customerJourney - Customer journey
   * @returns {Promise<Object>} Result
   */
  async executeWait(step, customerJourney) {
    const waitHours = step.wait_time || 24;
    const enteredAt = customerJourney.entered_at;

    // Check if wait time has elapsed
    const elapsedHours = (Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60);

    if (elapsedHours >= waitHours) {
      return { success: true };
    } else {
      // Still waiting
      await customerJourney.update({ status: 'Paused' });
      return { success: false, reason: 'Waiting' };
    }
  }

  /**
   * Execute Conditional action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeConditional(step, customer) {
    const condition = step.condition;
    // Evaluate condition against customer data
    // Implementation depends on condition structure
    return { success: true };
  }

  /**
   * Execute UpdateAttribute action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeUpdateAttribute(step, customer) {
    const config = step.action_config;
    await Customer.update(
      { [config.attribute]: config.value },
      { where: { id: customer.id } }
    );
    return { success: true };
  }

  /**
   * Execute AddToSegment action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeAddToSegment(step, customer) {
    const config = step.action_config;
    const { SegmentMember } = require('../models');
    
    await SegmentMember.create({
      segment_id: config.segmentId,
      customer_id: customer.id
    });
    
    return { success: true };
  }

  /**
   * Execute RemoveFromSegment action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeRemoveFromSegment(step, customer) {
    const config = step.action_config;
    const { SegmentMember } = require('../models');
    
    await SegmentMember.destroy({
      where: {
        segment_id: config.segmentId,
        customer_id: customer.id
      }
    });
    
    return { success: true };
  }

  /**
   * Execute CreateTask action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeCreateTask(step, customer) {
    const config = step.action_config;
    // Implementation depends on task system
    console.log(`Task created for ${customer.id}: ${config.task}`);
    return { success: true };
  }

  /**
   * Execute Webhook action
   * @param {JourneyStep} step - Journey step
   * @param {Customer} customer - Customer
   * @returns {Promise<Object>} Result
   */
  async executeWebhook(step, customer) {
    const config = step.action_config;
    // Implementation depends on webhook system
    return { success: true };
  }

  /**
   * Check if customer should exit journey
   * @param {CustomerJourney} customerJourney - Customer journey
   * @returns {Promise<boolean>} True if should exit
   */
  async shouldExitJourney(customerJourney) {
    const journey = await Journey.findByPk(customerJourney.journey_id);
    const exitCriteria = journey.config?.exit_criteria || {};

    if (Object.keys(exitCriteria).length === 0) {
      return false;
    }

    // Evaluate exit criteria
    // Implementation depends on criteria structure
    return false;
  }

  /**
   * Trigger journey for customer
   * @param {string} customerId - Customer ID
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @returns {Promise<Array>} Started journeys
   */
  async triggerJourneys(customerId, eventType, eventData) {
    const { JourneyTrigger } = require('../models');
    
    const triggers = await JourneyTrigger.findAll({
      where: { event_type: eventType },
      include: [{
        model: Journey,
        as: 'journey',
        where: { status: 'Active' }
      }]
    });

    const startedJourneys = [];

    for (const trigger of triggers) {
      // Check if condition is met
      if (await this.checkTriggerCondition(trigger, customerId, eventData)) {
        // Start journey for customer
        await this.startJourneyForCustomer(trigger.journey_id, customerId);
        startedJourneys.push(trigger.journey_id);
      }
    }

    return startedJourneys;
  }

  /**
   * Start journey for customer
   * @param {string} journeyId - Journey ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<CustomerJourney>} Customer journey record
   */
  async startJourneyForCustomer(journeyId, customerId) {
    // Check if already in journey
    const existing = await CustomerJourney.findOne({
      where: {
        journey_id: journeyId,
        customer_id: customerId,
        status: 'Active'
      }
    });

    if (existing) {
      return existing;
    }

    const customerJourney = await CustomerJourney.create({
      journey_id: journeyId,
      customer_id: customerId,
      status: 'Active',
      entered_at: new Date(),
      current_step_index: 0
    });

    // Process immediately
    const journey = await Journey.findByPk(journeyId);
    const steps = await JourneyStep.findAll({
      where: { journey_id: journeyId },
      order: [['step_order', 'ASC']]
    });

    await this.processCustomerJourney(customerJourney, steps);

    return customerJourney;
  }

  /**
   * Check if trigger condition is met
   * @param {JourneyTrigger} trigger - Journey trigger
   * @param {string} customerId - Customer ID
   * @param {Object} eventData - Event data
   * @returns {Promise<boolean>} True if condition met
   */
  async checkTriggerCondition(trigger, customerId, eventData) {
    const condition = trigger.condition;

    if (!condition || Object.keys(condition).length === 0) {
      return true;
    }

    // Evaluate condition
    // Implementation depends on condition structure
    return true;
  }
}

module.exports = new JourneyService();
7. AI-Powered Features
7.1 AI Service Implementation
File: services/AIService.js

javascript
const { OpenAI } = require('openai');
const { AIContentLog, Customer, Property } = require('../models');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'gpt-4-turbo-preview';
  }

  /**
   * Generate email content
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated content
   */
  async generateEmail(params) {
    const {
      customer,
      campaign,
      property,
      tone = 'professional',
      length = 'medium'
    } = params;

    const prompt = this.buildEmailPrompt({
      customer,
      campaign,
      property,
      tone,
      length
    });

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a professional marketing copywriter for a luxury real estate company in Ghana.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;

      // Parse response into subject and body
      const [subject, ...bodyParts] = content.split('\n\n');
      const body = bodyParts.join('\n\n');

      // Log AI usage
      await this.logAIContent({
        customerId: customer?.id,
        campaignId: campaign?.id,
        contentType: 'EmailBody',
        promptUsed: { prompt, tone, length },
        output: content,
        approved: false
      });

      return {
        subject: subject.replace('Subject:', '').trim(),
        body: body
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  /**
   * Generate SMS content
   * @param {Object} params - Generation parameters
   * @returns {Promise<string>} Generated SMS content
   */
  async generateSMS(params) {
    const {
      customer,
      campaign,
      property,
      maxLength = 160
    } = params;

    const prompt = this.buildSMSPrompt({
      customer,
      campaign,
      property,
      maxLength
    });

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a professional marketing copywriter for a luxury real estate company in Ghana. Create short, punchy SMS messages.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      const content = response.choices[0].message.content;

      // Log AI usage
      await this.logAIContent({
        customerId: customer?.id,
        campaignId: campaign?.id,
        contentType: 'SMSContent',
        promptUsed: { prompt, maxLength },
        output: content,
        approved: false
      });

      return content;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  /**
   * Generate property description
   * @param {Object} params - Generation parameters
   * @returns {Promise<string>} Generated description
   */
  async generatePropertyDescription(params) {
    const {
      property,
      targetAudience = 'Young professionals',
      tone = 'luxurious'
    } = params;

    const prompt = this.buildPropertyDescriptionPrompt({
      property,
      targetAudience,
      tone
    });

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a professional real estate copywriter for a luxury property developer in Ghana.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      const content = response.choices[0].message.content;

      // Log AI usage
      await this.logAIContent({
        contentType: 'PropertyDescription',
        promptUsed: { prompt, targetAudience, tone },
        output: content,
        approved: false
      });

      return content;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  /**
   * Calculate lead score
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Lead score and factors
   */
  async calculateLeadScore(customerId) {
    const customer = await Customer.findByPk(customerId, {
      include: [
        { model: EngagementEvent, as: 'events' },
        { model: Property, as: 'properties' }
      ]
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    let score = 0;
    const factors = [];

    // Factor 1: Property views (max 25 points)
    const views = customer.events?.filter(e => e.event_type === 'PropertyView') || [];
    const viewCount = views.length;
    if (viewCount >= 10) {
      score += 25;
      factors.push({ name: 'Property Views', score: 25, maxScore: 25, details: `${viewCount} views` });
    } else if (viewCount >= 5) {
      score += 15;
      factors.push({ name: 'Property Views', score: 15, maxScore: 25, details: `${viewCount} views` });
    } else if (viewCount >= 1) {
      score += 5;
      factors.push({ name: 'Property Views', score: 5, maxScore: 25, details: `${viewCount} views` });
    } else {
      factors.push({ name: 'Property Views', score: 0, maxScore: 25, details: 'No views' });
    }

    // Factor 2: Site visits (max 20 points)
    const visits = customer.events?.filter(e => e.event_type === 'SiteVisitAttended') || [];
    if (visits.length >= 2) {
      score += 20;
      factors.push({ name: 'Site Visits', score: 20, maxScore: 20, details: `${visits.length} visits` });
    } else if (visits.length >= 1) {
      score += 10;
      factors.push({ name: 'Site Visits', score: 10, maxScore: 20, details: `${visits.length} visits` });
    } else {
      factors.push({ name: 'Site Visits', score: 0, maxScore: 20, details: 'No visits' });
    }

    // Factor 3: Email engagement (max 20 points)
    const emails = customer.events?.filter(e => e.event_type === 'EmailOpen') || [];
    const emailCount = emails.length;
    if (emailCount >= 10) {
      score += 20;
      factors.push({ name: 'Email Engagement', score: 20, maxScore: 20, details: `${emailCount} opens` });
    } else if (emailCount >= 5) {
      score += 10;
      factors.push({ name: 'Email Engagement', score: 10, maxScore: 20, details: `${emailCount} opens` });
    } else if (emailCount >= 1) {
      score += 5;
      factors.push({ name: 'Email Engagement', score: 5, maxScore: 20, details: `${emailCount} opens` });
    } else {
      factors.push({ name: 'Email Engagement', score: 0, maxScore: 20, details: 'No opens' });
    }

    // Factor 4: Brochure downloads (max 15 points)
    const downloads = customer.events?.filter(e => e.event_type === 'BrochureDownload') || [];
    if (downloads.length >= 3) {
      score += 15;
      factors.push({ name: 'Brochure Downloads', score: 15, maxScore: 15, details: `${downloads.length} downloads` });
    } else if (downloads.length >= 1) {
      score += 5;
      factors.push({ name: 'Brochure Downloads', score: 5, maxScore: 15, details: `${downloads.length} downloads` });
    } else {
      factors.push({ name: 'Brochure Downloads', score: 0, maxScore: 15, details: 'No downloads' });
    }

    // Factor 5: Recency (max 20 points)
    const lastEvent = customer.events?.[0];
    if (lastEvent) {
      const daysSince = (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 2) {
        score += 20;
        factors.push({ name: 'Recency', score: 20, maxScore: 20, details: `${Math.round(daysSince)} days ago` });
      } else if (daysSince <= 7) {
        score += 15;
        factors.push({ name: 'Recency', score: 15, maxScore: 20, details: `${Math.round(daysSince)} days ago` });
      } else if (daysSince <= 14) {
        score += 10;
        factors.push({ name: 'Recency', score: 10, maxScore: 20, details: `${Math.round(daysSince)} days ago` });
      } else if (daysSince <= 30) {
        score += 5;
        factors.push({ name: 'Recency', score: 5, maxScore: 20, details: `${Math.round(daysSince)} days ago` });
      } else {
        factors.push({ name: 'Recency', score: 0, maxScore: 20, details: `${Math.round(daysSince)} days ago` });
      }
    } else {
      factors.push({ name: 'Recency', score: 0, maxScore: 20, details: 'No activity' });
    }

    // Save lead score
    const { LeadScore } = require('../models');
    await LeadScore.create({
      customer_id: customerId,
      score,
      last_calculated_at: new Date(),
      factors
    });

    return {
      score,
      factors,
      maxScore: 100,
      timestamp: new Date()
    };
  }

  /**
   * Log AI content usage
   * @param {Object} params - Log parameters
   * @returns {Promise<void>}
   */
  async logAIContent(params) {
    await AIContentLog.create({
      customer_id: params.customerId,
      campaign_id: params.campaignId,
      content_type: params.contentType,
      prompt_used: params.promptUsed,
      output: params.output,
      approved: params.approved || false,
      processed_at: new Date()
    });
  }

  /**
   * Build email prompt
   * @param {Object} params - Prompt parameters
   * @returns {string} Prompt
   */
  buildEmailPrompt(params) {
    const { customer, campaign, property, tone, length } = params;
    let prompt = `Write a marketing email for ${campaign?.name || 'a real estate campaign'}.`;

    if (customer) {
      prompt += ` The recipient is ${customer.first_name || 'a client'}${customer.last_name ? ` ${customer.last_name}` : ''}.`;
    }

    if (property) {
      prompt += ` The property is ${property.name || 'a luxury property'} in ${property.location || 'Accra'}.`;
    }

    prompt += ` The tone should be ${tone}. The length should be ${length}.`;

    return prompt;
  }

  /**
   * Build SMS prompt
   * @param {Object} params - Prompt parameters
   * @returns {string} Prompt
   */
  buildSMSPrompt(params) {
    const { customer, campaign, property, maxLength } = params;
    let prompt = `Write a short SMS message for ${campaign?.name || 'a real estate campaign'}.`;

    if (customer) {
      prompt += ` The recipient is ${customer.first_name || 'a client'}.`;
    }

    if (property) {
      prompt += ` The property is ${property.name || 'a luxury property'}.`;
    }

    prompt += ` Keep it under ${maxLength} characters. Include a call to action.`;

    return prompt;
  }

  /**
   * Build property description prompt
   * @param {Object} params - Prompt parameters
   * @returns {string} Prompt
   */
  buildPropertyDescriptionPrompt(params) {
    const { property, targetAudience, tone } = params;
    let prompt = `Write a ${tone} property description for a ${property.type || 'luxury'} property.`;

    if (property.name) {
      prompt += ` The property is called ${property.name}.`;
    }

    if (property.location) {
      prompt += ` It is located in ${property.location}.`;
    }

    if (property.features) {
      prompt += ` Features include: ${property.features.join(', ')}.`;
    }

    prompt += ` The target audience is ${targetAudience}.`;

    return prompt;
  }
}

module.exports = new AIService();
8. Segmentation Engine
8.1 Segmentation Service Implementation
File: services/SegmentationService.js

javascript
const { CustomerSegment, SegmentMember, Customer, EngagementEvent } = require('../models');
const { Op } = require('sequelize');

class SegmentationService {
  constructor() {
    this.refreshInterval = 60 * 60 * 1000; // 1 hour
    this.startRefreshScheduler();
  }

  /**
   * Start segment refresh scheduler
   */
  startRefreshScheduler() {
    setInterval(async () => {
      try {
        await this.refreshAllSegments();
      } catch (error) {
        console.error('Segment refresh error:', error);
      }
    }, this.refreshInterval);
  }

  /**
   * Refresh all dynamic segments
   */
  async refreshAllSegments() {
    const segments = await CustomerSegment.findAll({
      where: { is_dynamic: true }
    });

    for (const segment of segments) {
      await this.refreshSegment(segment);
    }
  }

  /**
   * Refresh a single segment
   * @param {CustomerSegment} segment - Segment to refresh
   */
  async refreshSegment(segment) {
    const criteria = segment.criteria;
    const customers = await this.evaluateCriteria(criteria);

    // Clear existing members
    await SegmentMember.destroy({
      where: { segment_id: segment.id }
    });

    // Add new members
    const members = customers.map(customer => ({
      segment_id: segment.id,
      customer_id: customer.id,
      added_at: new Date()
    }));

    if (members.length > 0) {
      await SegmentMember.bulkCreate(members);
    }

    // Update member count
    await segment.update({
      member_count: members.length,
      last_computed_at: new Date()
    });
  }

  /**
   * Evaluate criteria against customers
   * @param {Object} criteria - Segment criteria
   * @returns {Promise<Array>} Matching customers
   */
  async evaluateCriteria(criteria) {
    const whereClause = {};

    // Handle different criteria types
    if (criteria.kyc_status) {
      whereClause.kyc_status = criteria.kyc_status;
    }

    if (criteria.master_status) {
      whereClause.master_status = criteria.master_status;
    }

    if (criteria.engagement_score) {
      whereClause.engagement_score = {
        [Op.gte]: criteria.engagement_score.min || 0,
        [Op.lte]: criteria.engagement_score.max || 100
      };
    }

    if (criteria.created_after) {
      whereClause.created_at = {
        [Op.gte]: new Date(criteria.created_after)
      };
    }

    if (criteria.created_before) {
      whereClause.created_at = {
        [Op.lte]: new Date(criteria.created_before)
      };
    }

    if (criteria.property_types) {
      whereClause['$properties.unit_type$'] = criteria.property_types;
    }

    // Get base customers
    const customers = await Customer.findAll({
      where: whereClause,
      include: criteria.include_events ? [{
        model: EngagementEvent,
        as: 'events',
        limit: 50,
        order: [['timestamp', 'DESC']]
      }] : []
    });

    // Apply advanced criteria
    let filtered = customers;

    // Recency filter
    if (criteria.recency_days) {
      filtered = filtered.filter(customer => {
        const lastEvent = customer.events?.[0];
        if (!lastEvent) return false;
        const daysSince = (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= criteria.recency_days;
      });
    }

    // Property count filter
    if (criteria.property_count) {
      // Implementation depends on property model
    }

    // Payment status filter
    if (criteria.payment_status) {
      // Implementation depends on transaction model
    }

    return filtered;
  }

  /**
   * Get segment members
   * @param {string} segmentId - Segment ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Members with pagination
   */
  async getSegmentMembers(segmentId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const segment = await CustomerSegment.findByPk(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    const members = await SegmentMember.findAndCountAll({
      where: { segment_id: segmentId },
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_id', 'first_name', 'last_name', 'email', 'phone', 'kyc_status', 'master_status', 'engagement_score']
      }],
      order: [['added_at', 'DESC']],
      limit,
      offset
    });

    return {
      segment: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        member_count: segment.member_count,
        last_computed_at: segment.last_computed_at
      },
      members: members.rows.map(m => ({
        added_at: m.added_at,
        customer: m.customer
      })),
      pagination: {
        page,
        limit,
        total: members.count,
        totalPages: Math.ceil(members.count / limit)
      }
    };
  }

  /**
   * Create a new segment
   * @param {Object} data - Segment data
   * @param {string} userId - User ID creating the segment
   * @returns {Promise<CustomerSegment>} Created segment
   */
  async createSegment(data, userId) {
    const segment = await CustomerSegment.create({
      name: data.name,
      description: data.description,
      criteria: data.criteria,
      is_dynamic: data.is_dynamic !== false,
      created_by: userId
    });

    if (segment.is_dynamic) {
      // Initial refresh
      await this.refreshSegment(segment);
    }

    return segment;
  }

  /**
   * Update a segment
   * @param {string} segmentId - Segment ID
   * @param {Object} data - Updated data
   * @returns {Promise<CustomerSegment>} Updated segment
   */
  async updateSegment(segmentId, data) {
    const segment = await CustomerSegment.findByPk(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    await segment.update({
      name: data.name || segment.name,
      description: data.description || segment.description,
      criteria: data.criteria || segment.criteria,
      is_dynamic: data.is_dynamic !== undefined ? data.is_dynamic : segment.is_dynamic
    });

    if (segment.is_dynamic && data.criteria) {
      await this.refreshSegment(segment);
    }

    return segment;
  }

  /**
   * Delete a segment
   * @param {string} segmentId - Segment ID
   * @returns {Promise<void>}
   */
  async deleteSegment(segmentId) {
    const segment = await CustomerSegment.findByPk(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    await SegmentMember.destroy({
      where: { segment_id: segmentId }
    });

    await segment.destroy();
  }

  /**
   * Add customer to segment manually
   * @param {string} segmentId - Segment ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async addCustomerToSegment(segmentId, customerId) {
    const segment = await CustomerSegment.findByPk(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    await SegmentMember.create({
      segment_id: segmentId,
      customer_id: customerId,
      manually_added: true
    });

    await segment.increment('member_count');
  }

  /**
   * Remove customer from segment manually
   * @param {string} segmentId - Segment ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async removeCustomerFromSegment(segmentId, customerId) {
    const segment = await CustomerSegment.findByPk(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    await SegmentMember.destroy({
      where: {
        segment_id: segmentId,
        customer_id: customerId
      }
    });

    await segment.decrement('member_count');
  }
}

module.exports = new SegmentationService();
9. Analytics & Reporting
9.1 Analytics Service Implementation
File: services/AnalyticsService.js

javascript
const { Customer, Message, EngagementEvent, Campaign, Journey, Complaint, Transaction } = require('../models');
const { Op, Sequelize } = require('sequelize');

class AnalyticsService {
  /**
   * Get campaign performance metrics
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Campaign metrics
   */
  async getCampaignMetrics(campaignId, options = {}) {
    const { startDate, endDate } = options;

    const dateFilter = {};
    if (startDate) dateFilter.sent_at = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.sent_at = { [Op.lte]: new Date(endDate) };

    const messages = await Message.findAll({
      where: {
        campaign_id: campaignId,
        ...dateFilter
      }
    });

    const total = messages.length;
    const sent = messages.filter(m => m.sent_at).length;
    const delivered = messages.filter(m => m.delivered_at).length;
    const opened = messages.filter(m => m.opened_at).length;
    const clicked = messages.filter(m => m.clicked_at).length;
    const replied = messages.filter(m => m.replied_at).length;
    const bounced = messages.filter(m => m.bounced_at).length;

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      replied,
      bounced,
      rates: {
        delivery: total > 0 ? (delivered / total) * 100 : 0,
        open: delivered > 0 ? (opened / delivered) * 100 : 0,
        click: opened > 0 ? (clicked / opened) * 100 : 0,
        reply: delivered > 0 ? (replied / delivered) * 100 : 0,
        bounce: total > 0 ? (bounced / total) * 100 : 0
      },
      period: {
        start: startDate || null,
        end: endDate || null
      }
    };
  }

  /**
   * Get customer engagement metrics
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Engagement metrics
   */
  async getCustomerEngagementMetrics(customerId, options = {}) {
    const { days = 90 } = options;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await EngagementEvent.findAll({
      where: {
        customer_id: customerId,
        timestamp: { [Op.gte]: since }
      },
      order: [['timestamp', 'DESC']]
    });

    const messages = await Message.findAll({
      where: {
        customer_id: customerId,
        sent_at: { [Op.gte]: since }
      },
      order: [['sent_at', 'DESC']]
    });

    // Calculate metrics
    const eventTypes = {};
    for (const event of events) {
      eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
    }

    const channelMetrics = {};
    for (const message of messages) {
      channelMetrics[message.channel] = channelMetrics[message.channel] || {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0
      };
      channelMetrics[message.channel].sent++;
      if (message.opened_at) channelMetrics[message.channel].opened++;
      if (message.clicked_at) channelMetrics[message.channel].clicked++;
      if (message.replied_at) channelMetrics[message.channel].replied++;
    }

    const totalMessages = messages.length;
    const totalOpens = messages.filter(m => m.opened_at).length;
    const totalClicks = messages.filter(m => m.clicked_at).length;
    const totalReplies = messages.filter(m => m.replied_at).length;

    return {
      period: { days, since },
      summary: {
        total_events: events.length,
        total_messages: totalMessages,
        open_rate: totalMessages > 0 ? (totalOpens / totalMessages) * 100 : 0,
        click_rate: totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0,
        reply_rate: totalMessages > 0 ? (totalReplies / totalMessages) * 100 : 0
      },
      event_breakdown: eventTypes,
      channel_breakdown: channelMetrics,
      daily_activity: this.aggregateDailyActivity(events, messages),
      trends: this.calculateTrends(events, messages)
    };
  }

  /**
   * Get client journey analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Journey analytics
   */
  async getJourneyAnalytics(options = {}) {
    const { journeyId, startDate, endDate } = options;

    const whereClause = {};
    if (journeyId) whereClause.journey_id = journeyId;
    if (startDate) whereClause.entered_at = { [Op.gte]: new Date(startDate) };
    if (endDate) whereClause.entered_at = { [Op.lte]: new Date(endDate) };

    const { CustomerJourney } = require('../models');
    const journeys = await CustomerJourney.findAll({
      where: whereClause
    });

    const total = journeys.length;
    const active = journeys.filter(j => j.status === 'Active').length;
    const completed = journeys.filter(j => j.status === 'Completed').length;
    const paused = journeys.filter(j => j.status === 'Paused').length;

    // Calculate completion time
    const completedJourneys = journeys.filter(j => j.status === 'Completed' && j.exit_reason !== 'Exit criteria met');
    const avgCompletionTime = completedJourneys.length > 0
      ? completedJourneys.reduce((sum, j) => {
          const time = new Date(j.updated_at).getTime() - new Date(j.entered_at).getTime();
          return sum + time;
        }, 0) / completedJourneys.length
      : 0;

    // Calculate drop-off by step
    const { CustomerJourneyStep } = require('../models');
    const stepData = await CustomerJourneyStep.findAll({
      where: {
        customer_journey_id: journeys.map(j => j.id)
      },
      attributes: [
        'step_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completed_count'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'Failed' THEN 1 ELSE 0 END")), 'failed_count']
      ],
      group: ['step_id']
    });

    return {
      summary: {
        total,
        active,
        completed,
        paused,
        completion_rate: total > 0 ? (completed / total) * 100 : 0,
        average_completion_time_hours: avgCompletionTime / (1000 * 60 * 60)
      },
      steps: stepData.map(s => ({
        step_id: s.dataValues.step_id,
        total: parseInt(s.dataValues.count),
        completed: parseInt(s.dataValues.completed_count),
        failed: parseInt(s.dataValues.failed_count),
        conversion_rate: s.dataValues.count > 0
          ? (parseInt(s.dataValues.completed_count) / parseInt(s.dataValues.count)) * 100
          : 0
      }))
    };
  }

  /**
   * Get revenue analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Revenue analytics
   */
  async getRevenueAnalytics(options = {}) {
    const { startDate, endDate } = options;

    const dateFilter = {};
    if (startDate) dateFilter.created_at = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.created_at = { [Op.lte]: new Date(endDate) };

    const transactions = await Transaction.findAll({
      where: dateFilter
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCount = transactions.length;

    // Group by type
    const byType = {};
    for (const transaction of transactions) {
      byType[transaction.type] = byType[transaction.type] || { count: 0, amount: 0 };
      byType[transaction.type].count++;
      byType[transaction.type].amount += transaction.amount;
    }

    // Calculate average transaction value
    const avgValue = totalCount > 0 ? totalRevenue / totalCount : 0;

    return {
      summary: {
        total_revenue: totalRevenue,
        total_transactions: totalCount,
        average_transaction_value: avgValue,
        period: { start: startDate || null, end: endDate || null }
      },
      by_type: byType,
      by_day: this.aggregateDailyTransactions(transactions)
    };
  }

  /**
   * Aggregate daily activity
   * @param {Array} events - Events
   * @param {Array} messages - Messages
   * @returns {Object} Daily activity
   */
  aggregateDailyActivity(events, messages) {
    const daily = {};

    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      daily[date] = daily[date] || { events: 0, messages: 0 };
      daily[date].events++;
    }

    for (const message of messages) {
      const date = new Date(message.sent_at).toISOString().split('T')[0];
      daily[date] = daily[date] || { events: 0, messages: 0 };
      daily[date].messages++;
    }

    return daily;
  }

  /**
   * Aggregate daily transactions
   * @param {Array} transactions - Transactions
   * @returns {Object} Daily transactions
   */
  aggregateDailyTransactions(transactions) {
    const daily = {};

    for (const transaction of transactions) {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      daily[date] = daily[date] || { count: 0, amount: 0 };
      daily[date].count++;
      daily[date].amount += transaction.amount;
    }

    return daily;
  }

  /**
   * Calculate engagement trends
   * @param {Array} events - Events
   * @param {Array} messages - Messages
   * @returns {Object} Trends
   */
  calculateTrends(events, messages) {
    // Calculate 7-day rolling average
    const trends = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEvents = events.filter(e =>
        new Date(e.timestamp).toISOString().split('T')[0] === dateStr
      );
      const dayMessages = messages.filter(m =>
        new Date(m.sent_at).toISOString().split('T')[0] === dateStr
      );

      trends.push({
        date: dateStr,
        events: dayEvents.length,
        messages: dayMessages.length,
        opens: dayMessages.filter(m => m.opened_at).length,
        clicks: dayMessages.filter(m => m.clicked_at).length
      });
    }

    return trends.reverse();
  }
}

module.exports = new AnalyticsService();
10. API Specifications
10.1 Complete API Documentation
File: routes/api.js

javascript
const express = require('express');
const router = express.Router();
const CDPService = require('../services/CDPService');
const JourneyService = require('../services/JourneyService');
const SegmentationService = require('../services/SegmentationService');
const AnalyticsService = require('../services/AnalyticsService');
const AIService = require('../services/AIService');
const ChannelRouter = require('../services/channels/ChannelRouter');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== CDP API ====================

/**
 * GET /api/cdp/profile/:customerId
 * Get unified customer profile
 */
router.get('/cdp/profile/:customerId', authenticate, async (req, res) => {
  try {
    const profile = await CDPService.getUnifiedProfile(req.params.customerId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/cdp/event
 * Ingest an event
 */
router.post('/cdp/event', authenticate, async (req, res) => {
  try {
    const event = await CDPService.ingestEvent(req.body);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cdp/engagement/:customerId
 * Get engagement data for customer
 */
router.get('/cdp/engagement/:customerId', authenticate, async (req, res) => {
  try {
    const data = await CDPService.getEngagementData(req.params.customerId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Journey API ====================

/**
 * GET /api/journeys
 * Get all journeys
 */
router.get('/journeys', authenticate, async (req, res) => {
  try {
    const { Journey } = require('../models');
    const journeys = await Journey.findAll({
      include: ['steps', 'triggers']
    });
    res.json({ success: true, data: journeys });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/journeys
 * Create a new journey
 */
router.post('/journeys', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { Journey } = require('../models');
    const journey = await Journey.create({
      ...req.body,
      created_by: req.user.id
    });
    res.json({ success: true, data: journey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/journeys/trigger
 * Trigger a journey for a customer
 */
router.post('/journeys/trigger', authenticate, async (req, res) => {
  try {
    const { customerId, eventType, eventData } = req.body;
    const journeys = await JourneyService.triggerJourneys(customerId, eventType, eventData);
    res.json({ success: true, data: { started: journeys } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/journeys/:id/stats
 * Get journey statistics
 */
router.get('/journeys/:id/stats', authenticate, async (req, res) => {
  try {
    const data = await AnalyticsService.getJourneyAnalytics({
      journeyId: req.params.id
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Segmentation API ====================

/**
 * GET /api/segments
 * Get all segments
 */
router.get('/segments', authenticate, async (req, res) => {
  try {
    const { CustomerSegment } = require('../models');
    const segments = await CustomerSegment.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: segments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/segments
 * Create a new segment
 */
router.post('/segments', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const segment = await SegmentationService.createSegment(req.body, req.user.id);
    res.json({ success: true, data: segment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/segments/:id/members
 * Get segment members
 */
router.get('/segments/:id/members', authenticate, async (req, res) => {
  try {
    const { page, limit } = req.query;
    const data = await SegmentationService.getSegmentMembers(req.params.id, { page, limit });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/segments/:id/refresh
 * Refresh a segment
 */
router.post('/segments/:id/refresh', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { CustomerSegment } = require('../models');
    const segment = await CustomerSegment.findByPk(req.params.id);
    if (!segment) {
      return res.status(404).json({ success: false, error: 'Segment not found' });
    }
    await SegmentationService.refreshSegment(segment);
    res.json({ success: true, message: 'Segment refreshed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Analytics API ====================

/**
 * GET /api/analytics/campaign/:campaignId
 * Get campaign metrics
 */
router.get('/analytics/campaign/:campaignId', authenticate, async (req, res) => {
  try {
    const data = await AnalyticsService.getCampaignMetrics(req.params.campaignId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/customer/:customerId
 * Get customer engagement metrics
 */
router.get('/analytics/customer/:customerId', authenticate, async (req, res) => {
  try {
    const data = await AnalyticsService.getCustomerEngagementMetrics(req.params.customerId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics
 */
router.get('/analytics/revenue', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const data = await AnalyticsService.getRevenueAnalytics(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI API ====================

/**
 * POST /api/ai/generate/email
 * Generate email content
 */
router.post('/ai/generate/email', authenticate, authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const content = await AIService.generateEmail(req.body);
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/generate/sms
 * Generate SMS content
 */
router.post('/ai/generate/sms', authenticate, authorize(['admin', 'marketing']), async (req, res) => {
  try {
    const content = await AIService.generateSMS(req.body);
    res.json({ success: true, data: { body: content } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/leads/score/:customerId
 * Calculate lead score
 */
router.post('/ai/leads/score/:customerId', authenticate, async (req, res) => {
  try {
    const score = await AIService.calculateLeadScore(req.params.customerId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Messaging API ====================

/**
 * POST /api/messages/send
 * Send a message via any channel
 */
router.post('/messages/send', authenticate, async (req, res) => {
  try {
    const { customerId, channel, ...messageParams } = req.body;
    const { Customer } = require('../models');
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const result = await ChannelRouter.sendMessage({
      channel,
      customer,
      ...messageParams
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/messages/history/:customerId
 * Get message history for customer
 */
router.get('/messages/history/:customerId', authenticate, async (req, res) => {
  try {
    const { Message } = require('../models');
    const messages = await Message.findAll({
      where: { customer_id: req.params.customerId },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Customer 360 API ====================

/**
 * GET /api/customer/360/:customerId
 * Get complete 360 view data for customer
 */
router.get('/customer/360/:customerId', authenticate, async (req, res) => {
  try {
    // Get all data in parallel
    const [
      profile,
      engagement,
      messages,
      properties,
      transactions,
      complaints,
      journeys,
      segments
    ] = await Promise.all([
      CDPService.getUnifiedProfile(req.params.customerId),
      AnalyticsService.getCustomerEngagementMetrics(req.params.customerId),
      require('../models').Message.findAll({
        where: { customer_id: req.params.customerId },
        order: [['created_at', 'DESC']],
        limit: 20
      }),
      require('../models').Property.findAll({
        where: { customer_id: req.params.customerId }
      }),
      require('../models').Transaction.findAll({
        where: { customer_id: req.params.customerId }
      }),
      require('../models').Complaint.findAll({
        where: { customer_id: req.params.customerId }
      }),
      require('../models').CustomerJourney.findAll({
        where: { customer_id: req.params.customerId }
      }),
      require('../models').CustomerSegment.findAll({
        include: [{
          model: require('../models').Customer,
          as: 'customers',
          where: { id: req.params.customerId },
          required: true
        }]
      })
    ]);

    res.json({
      success: true,
      data: {
        profile,
        engagement,
        messages,
        properties,
        transactions,
        complaints,
        journeys,
        segments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
11. Frontend Components
11.1 Component Structure
text
src/
├── components/
│   ├── customer-360/
│   │   ├── Customer360Page.js
│   │   ├── CustomerHeader.js
│   │   ├── KYCProgressRing.js
│   │   ├── RelationshipHealthChip.js
│   │   ├── LeadStageTracker.js
│   │   ├── ActivityTimeline.js
│   │   ├── OpportunityPipeline.js
│   │   ├── EngagementHeatmap.js
│   │   ├── PaymentTimeline.js
│   │   └── AgingDonut.js
│   ├── marketing/
│   │   ├── SegmentBuilder.js
│   │   ├── JourneyBuilder.js
│   │   ├── CampaignManager.js
│   │   └── MessageTemplateEditor.js
│   ├── common/
│   │   ├── SidePanel.js
│   │   ├── ChartTooltip.js
│   │   ├── LoadingSpinner.js
│   │   └── EmptyState.js
│   └── dashboard/
│       ├── MarketingDashboard.js
│       ├── EngagementDashboard.js
│       └── AnalyticsDashboard.js
11.2 Customer 360 Page Component
File: components/customer-360/Customer360Page.js

jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CustomerHeader } from './CustomerHeader';
import { LeadStageTracker } from './LeadStageTracker';
import { ActivityTimeline } from './ActivityTimeline';
import { OpportunityPipeline } from './OpportunityPipeline';
import { EngagementHeatmap } from './EngagementHeatmap';
import { PaymentTimeline } from './PaymentTimeline';
import { AgingDonut } from './AgingDonut';
import { SidePanel } from '../common/SidePanel';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import api from '../../services/api';

const Customer360Page = () => {
  const { customerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState(null);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/customer/360/${customerId}`);
      setCustomerData(response.data.data);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSidePanel = (content) => {
    setSidePanelContent(content);
    setSidePanelOpen(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!customerData) {
    return <EmptyState message="Customer not found" />;
  }

  const { profile, engagement, messages, properties, transactions, complaints, journeys, segments } = customerData;

  return (
    <div className="customer-360-page">
      {/* Header Block */}
      <CustomerHeader 
        profile={profile}
        onKYCClick={() => openSidePanel({ type: 'kyc', data: profile })}
        onHealthClick={() => openSidePanel({ type: 'health', data: engagement })}
      />

      {/* Sales Journey - Leads */}
      <section className="section sales-journey">
        <h2 className="section-title">Sales Journey</h2>
        {properties?.map(property => (
          <LeadStageTracker 
            key={property.id}
            property={property}
            onExpand={() => openSidePanel({ type: 'lead', data: property })}
          />
        ))}
        <ActivityTimeline 
          activities={messages} 
          onActivityClick={(activity) => openSidePanel({ type: 'activity', data: activity })}
        />
      </section>

      {/* Opportunities */}
      <section className="section opportunities">
        <h2 className="section-title">Opportunities</h2>
        <OpportunityPipeline 
          opportunities={[]}  // Will be populated from opportunities data
          onOpportunityClick={(opp) => openSidePanel({ type: 'opportunity', data: opp })}
        />
      </section>

      {/* Engagement Heatmap */}
      <section className="section engagement">
        <h2 className="section-title">Engagement</h2>
        <EngagementHeatmap 
          events={engagement.events || []}
          onDayClick={(date) => openSidePanel({ type: 'engagement_day', data: { date, events: engagement.events } })}
        />
      </section>

      {/* Payment History */}
      <section className="section payment-history">
        <h2 className="section-title">Payment History</h2>
        <div className="payment-grid">
          <PaymentTimeline 
            transactions={transactions}
            onPointClick={(transaction) => openSidePanel({ type: 'transaction', data: transaction })}
          />
          <AgingDonut 
            transactions={transactions}
            onSegmentClick={(segment) => openSidePanel({ type: 'aging', data: segment })}
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="section quick-actions">
        <button className="btn btn-primary" onClick={() => openSidePanel({ type: 'interaction' })}>
          Log Interaction
        </button>
        <button className="btn btn-secondary" onClick={() => openSidePanel({ type: 'visit' })}>
          Schedule Visit
        </button>
        <button className="btn btn-warning" onClick={() => openSidePanel({ type: 'complaint' })}>
          Log Complaint
        </button>
        <button className="btn btn-success" onClick={() => openSidePanel({ type: 'property' })}>
          Add Property
        </button>
      </section>

      {/* Side Panel */}
      <SidePanel 
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        content={sidePanelContent}
      />
    </div>
  );
};

export default Customer360Page;
11.3 CSS Styles
File: styles/customer-360.css

css
/* Customer 360 Page Styles */

.customer-360-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Section Styles */
.section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8E8E8;
}

/* Grid Layouts */
.payment-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .payment-grid {
    grid-template-columns: 1fr;
  }
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  background: #F8F9FA;
}

.quick-actions .btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #0019F9;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #0015CC;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6C757D;
  color: #FFFFFF;
}

.btn-secondary:hover {
  background: #5A6268;
  transform: translateY(-1px);
}

.btn-warning {
  background: #FFB800;
  color: #1A1A2E;
}

.btn-warning:hover {
  background: #E5A500;
  transform: translateY(-1px);
}

.btn-success {
  background: #00A86A;
  color: #FFFFFF;
}

.btn-success:hover {
  background: #008F5A;
  transform: translateY(-1px);
}

/* Tooltips */
[data-tooltip] {
  position: relative;
  cursor: pointer;
}

[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 26, 46, 0.95);
  color: #FFFFFF;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-line;
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Empty States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6C757D;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 14px;
  max-width: 400px;
  line-height: 1.6;
}

/* Health Chip */
.health-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 8px;
  background: #F8F9FA;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.health-chip:hover {
  background: #E9ECEF;
}

.health-chip-label {
  color: #6C757D;
}

.health-chip-score {
  font-weight: 600;
}

.health-chip-sparkline {
  margin-left: 4px;
}

/* KYC Progress Ring */
.kyc-progress-ring {
  display: inline-block;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

/* Side Panel */
.side-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 9998;
}

.side-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100%;
  background: #FFFFFF;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  transform: translateX(100%);
  transition: transform 300ms ease-out;
  overflow-y: auto;
}

.side-panel.open {
  transform: translateX(0);
}

.side-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E8E8E8;
  position: sticky;
  top: 0;
  background: #FFFFFF;
  z-index: 1;
}

.side-panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.side-panel-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6C757D;
  padding: 4px 8px;
  border-radius: 4px;
}

.side-panel-close:hover {
  background: #F8F9FA;
  color: #1A1A2E;
}

.side-panel-body {
  padding: 24px;
}

@media (max-width: 768px) {
  .side-panel {
    width: 100%;
  }
}
12. Security & Compliance
12.1 GDPR/CCPA Compliance Implementation
File: services/ComplianceService.js

javascript
const { Customer, EngagementEvent, Message, Transaction } = require('../models');
const { Op } = require('sequelize');

class ComplianceService {
  /**
   * Export customer data for DSAR
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer data package
   */
  async exportCustomerData(customerId) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const [events, messages, transactions] = await Promise.all([
      EngagementEvent.findAll({
        where: { customer_id: customerId },
        order: [['timestamp', 'ASC']]
      }),
      Message.findAll({
        where: { customer_id: customerId },
        order: [['created_at', 'ASC']]
      }),
      Transaction.findAll({
        where: { customer_id: customerId },
        order: [['created_at', 'ASC']]
      })
    ]);

    return {
      customer: customer.toJSON(),
      engagement_events: events.map(e => e.toJSON()),
      messages: messages.map(m => ({
        ...m.toJSON(),
        content: m.content // Include message content
      })),
      transactions: transactions.map(t => t.toJSON()),
      export_date: new Date(),
      export_format: 'JSON'
    };
  }

  /**
   * Anonymize customer data (Right to be Forgotten)
   * @param {string} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async anonymizeCustomer(customerId) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Anonymize customer record
    await customer.update({
      first_name: 'Anonymized',
      last_name: `User-${customerId.slice(0, 8)}`,
      email: null,
      phone: null,
      tax_id: null,
      consent: false,
      opt_out_email: true,
      opt_out_sms: true,
      opt_out_whatsapp: true
    });

    // Anonymize engagement events (remove PII)
    await EngagementEvent.update(
      { metadata: {} },
      { where: { customer_id: customerId } }
    );

    // Anonymize messages (remove content)
    await Message.update(
      { content: {}, subject: null },
      { where: { customer_id: customerId } }
    );

    // Log anonymization
    console.log(`Customer ${customerId} anonymized at ${new Date()}`);
  }

  /**
   * Check data retention policies
   * @returns {Promise<void>}
   */
  async enforceRetentionPolicies() {
    const retentionDays = 365 * 7; // 7 years

    // Find customers with no activity for > retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const customers = await Customer.findAll({
      where: {
        updated_at: { [Op.lt]: cutoffDate },
        master_status: { [Op.not]: 'Handover Complete' }
      }
    });

    for (const customer of customers) {
      // Anonymize or archive based on policy
      await this.anonymizeCustomer(customer.id);
    }
  }
}

module.exports = new ComplianceService();
12.2 Audit Logging Middleware
File: middleware/audit.js

javascript
const { AuditLog } = require('../models');

const auditLog = (action, resource, resourceId) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log after response is sent
      if (req.user && req.user.id) {
        AuditLog.create({
          user_id: req.user.id,
          action,
          resource,
          resource_id: resourceId || req.params.id,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          timestamp: new Date(),
          metadata: {
            method: req.method,
            url: req.url,
            body: req.body,
            response: data
          }
        }).catch(err => console.error('Audit log error:', err));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = { auditLog };
13. Development Timeline & Milestones
13.1 Sprint Breakdown
Sprint	Focus	Deliverables	Duration
Sprint 1	Database & Foundation	Complete data model, migrations, base models	2 weeks
Sprint 2	CDP Service	CDP implementation, event ingestion, unified profiles	2 weeks
Sprint 3	Omnichannel Integration	Email, SMS, WhatsApp services, webhooks	2 weeks
Sprint 4	Journey Orchestration	Journey builder, step execution, triggers	2 weeks
Sprint 5	Segmentation & AI	Segment engine, AI content generation, lead scoring	2 weeks
Sprint 6	Analytics & Reporting	Analytics service, dashboards, metrics	2 weeks
Sprint 7	Frontend Components	Customer 360 page, all UI components	2 weeks
Sprint 8	Testing & Deployment	UAT, bug fixes, production deployment	2 weeks
13.2 Milestone Checklist
Milestone	Description	Owner
[ ] M1	Database schema approved and migrated	Backend Lead
[ ] M2	CDP service passing all unit tests	Backend Lead
[ ] M3	Email integration working end-to-end	Backend Lead
[ ] M4	SMS/WhatsApp integration working	Backend Lead
[ ] M5	Journey builder MVP functional	Full Stack Lead
[ ] M6	Segmentation engine working	Backend Lead
[ ] M7	AI features integrated	AI Lead
[ ] M8	Customer 360 page complete	Frontend Lead
[ ] M9	UAT sign-off	QA Lead
[ ] M10	Production deployment	DevOps Lead
14. Testing Strategy
14.1 Unit Test Examples
File: tests/services/CDPService.test.js

javascript
const CDPService = require('../../services/CDPService');
const { Customer, EngagementEvent } = require('../../models');

describe('CDPService', () => {
  describe('getUnifiedProfile', () => {
    it('should return unified customer profile', async () => {
      const customerId = 'test-customer-1';
      const profile = await CDPService.getUnifiedProfile(customerId);
      
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('customer_id');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('engagement_score');
      expect(profile).toHaveProperty('summary');
      expect(profile.summary).toHaveProperty('total_properties');
      expect(profile).toHaveProperty('next_best_action');
    });

    it('should use cache for subsequent requests', async () => {
      const customerId = 'test-customer-2';
      const startTime = Date.now();
      
      await CDPService.getUnifiedProfile(customerId);
      const secondCall = await CDPService.getUnifiedProfile(customerId);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
      expect(secondCall).toBeDefined();
    });
  });

  describe('ingestEvent', () => {
    it('should save event and update engagement score', async () => {
      const customerId = 'test-customer-3';
      const eventData = {
        customerId,
        eventType: 'PropertyView',
        channel: 'Web',
        source: 'Website',
        metadata: { propertyId: 'test-property-1' }
      };
      
      const event = await CDPService.ingestEvent(eventData);
      
      expect(event).toHaveProperty('id');
      expect(event.event_type).toBe('PropertyView');
      
      const updatedCustomer = await Customer.findByPk(customerId);
      expect(updatedCustomer.engagement_score).toBeGreaterThan(0);
    });
  });
});
14.2 Integration Tests
File: tests/integration/journey.test.js

javascript
const JourneyService = require('../../services/JourneyService');
const { Journey, JourneyStep, Customer } = require('../../models');

describe('Journey Integration Tests', () => {
  let testJourney;
  let testCustomer;

  beforeAll(async () => {
    testCustomer = await Customer.create({
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '+233 24 123 4567'
    });

    testJourney = await Journey.create({
      name: 'Test Journey',
      status: 'Active',
      config: {}
    });
  });

  it('should process a complete journey', async () => {
    const steps = await JourneyStep.findAll({
      where: { journey_id: testJourney.id },
      order: [['step_order', 'ASC']]
    });

    // Start journey
    const customerJourney = await JourneyService.startJourneyForCustomer(
      testJourney.id,
      testCustomer.id
    );

    expect(customerJourney.status).toBe('Active');
    expect(customerJourney.current_step_index).toBe(0);

    // Process journey (should complete if no wait steps)
    await JourneyService.processCustomerJourney(customerJourney, steps);
    
    const updated = await customerJourney.reload();
    expect(updated.status).toBe('Completed');
  });
});
15. Deployment Guide
15.1 Environment Variables
File: .env.example

bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/devcrm_marketing
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=marketing@devtraco.com

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_STATUS_CALLBACK_URL=https://api.devtraco.com/webhooks/sms/twilio
TWILIO_WHATSAPP_STATUS_CALLBACK_URL=https://api.devtraco.com/webhooks/whatsapp/twilio

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://app.devtraco.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
15.2 Docker Configuration
File: Dockerfile

dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy source code
COPY . .

# Build frontend
RUN yarn build

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "src/index.js"]
File: docker-compose.yml

yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://devcrm:devcrm_password@postgres:5432/devcrm_marketing
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=devcrm
      - POSTGRES_PASSWORD=devcrm_password
      - POSTGRES_DB=devcrm_marketing
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  worker:
    build: .
    command: node src/worker.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://devcrm:devcrm_password@postgres:5432/devcrm_marketing
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
  redis_data:
15.3 CI/CD Pipeline
File: .github/workflows/deploy.yml

yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test
      - run: yarn lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn build
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build
      - uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: aws s3 sync ./ s3://devcrm-marketing/build --delete
      - run: aws s3 sync ./ s3://devcrm-marketing/build --cache-control "max-age=31536000"
      - run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
16. Developer Quick Reference
16.1 Key Commands
bash
# Setup
npm install                 # Install dependencies
npm run db:migrate          # Run database migrations
npm run db:seed             # Seed database with test data

# Development
npm run dev                 # Start development server with hot-reload
npm run dev:worker          # Start worker process
npm run dev:all             # Start all services

# Testing
npm run test                # Run all tests
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests only
npm run test:coverage       # Run tests with coverage report

# Linting & Formatting
npm run lint                # Run ESLint
npm run lint:fix            # Fix linting issues
npm run format              # Format code with Prettier

# Building
npm run build               # Build for production
npm run build:watch         # Build with watch mode

# Deployment
npm run deploy:staging      # Deploy to staging
npm run deploy:production   # Deploy to production
16.2 Common Database Queries
sql
-- Get customer 360 summary
SELECT 
  c.id,
  c.customer_id,
  c.first_name,
  c.last_name,
  c.email,
  c.kyc_status,
  c.master_status,
  c.engagement_score,
  COUNT(DISTINCT e.id) as event_count,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT t.id) as transaction_count
FROM customers c
LEFT JOIN engagement_events e ON e.customer_id = c.id
LEFT JOIN messages m ON m.customer_id = c.id
LEFT JOIN transactions t ON t.customer_id = c.id
WHERE c.id = 'customer-id'
GROUP BY c.id;

-- Get campaign performance
SELECT 
  campaign_id,
  channel,
  COUNT(*) as sent,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
  COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked,
  ROUND(COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) as open_rate
FROM messages
WHERE campaign_id = 'campaign-id'
GROUP BY campaign_id, channel;

-- Get active journey customers
SELECT 
  cj.customer_id,
  cj.current_step_index,
  c.first_name,
  c.last_name,
  c.email,
  cj.entered_at,
  EXTRACT(DAY FROM NOW() - cj.entered_at) as days_in_journey
FROM customer_journeys cj
JOIN customers c ON c.id = cj.customer_id
WHERE cj.journey_id = 'journey-id'
  AND cj.status = 'Active';
16.3 Common API Calls
bash
# Get customer 360 profile
curl -H "Authorization: Bearer $TOKEN" \
  https://api.devtraco.com/api/customer/360/CUS-001

# Trigger a journey
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUS-001",
    "eventType": "PropertyView",
    "eventData": {"propertyId": "PROP-001"}
  }' \
  https://api.devtraco.com/api/journeys/trigger

# Send a marketing message
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUS-001",
    "channel": "Email",
    "templateId": "TMP-001",
    "templateData": {
      "first_name": "Kwame",
      "property_name": "Parkview Residences"
    }
  }' \
  https://api.devtraco.com/api/messages/send

# Generate AI content
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUS-001",
    "campaignId": "CAM-001",
    "tone": "professional",
    "length": "medium"
  }' \
  https://api.devtraco.com/api/ai/generate/email

# Create a segment
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High-Intent Buyers",
    "criteria": {
      "kyc_status": "Approved",
      "engagement_score": {"min": 70},
      "property_count": {"min": 1}
    },
    "is_dynamic": true
  }' \
  https://api.devtraco.com/api/segments
16.4 Troubleshooting Guide
Issue	Likely Cause	Solution
Database connection error	Wrong DATABASE_URL	Check environment variables
Redis connection error	Redis not running	Start Redis: redis-server
Email not sending	Invalid SendGrid API key	Verify SENDGRID_API_KEY
SMS not sending	Invalid Twilio credentials	Verify TWILIO_ACCOUNT_SID and AUTH_TOKEN
Journey not processing	Worker not running	Start worker: npm run dev:worker
AI generation failing	OpenAI API key invalid	Verify OPENAI_API_KEY
Webhook not receiving	Incorrect webhook URL	Check webhook configuration
CORS errors	Invalid CORS origin	Update CORS_ORIGIN in .env
Developer Contact & Support
Resource	Contact	Role
Project Lead	[Name]	Technical Lead
Backend Lead	[Name]	Backend Architecture
Frontend Lead	[Name]	UI Implementation
DevOps Lead	[Name]	Deployment & Infrastructure
QA Lead	[Name]	Testing & Quality
End of Document: Comprehensive Developer Implementation Guide