# CRM Developer Prompt: 360-Degree Customer View Implementation

## Detailed Technical Specifications for Dynamics 365 Development

---

**Document Version:** 1.0  
**Date:** September 02, 2026  
**Prepared By:** CRM Optimization Consultant  
**Target Audience:** CRM Developer / Implementation Partner  
**System:** Microsoft Dynamics 365 Customer Engagement  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Implementation Scope](#1-implementation-scope)
3. [Entity Configuration Specifications](#2-entity-configuration-specifications)
4. [Form Customization Specifications](#3-form-customization-specifications)
5. [Dashboard & View Specifications](#4-dashboard--view-specifications)
6. [Workflow Automation Specifications](#5-workflow-automation-specifications)
7. [Integration Specifications](#6-integration-specifications)
8. [Security & Access Control Specifications](#7-security--access-control-specifications)
9. [Data Migration Plan](#8-data-migration-plan)
10. [Testing Specifications](#9-testing-specifications)
11. [Training Requirements](#10-training-requirements)
12. [Placeholder Specifications](#11-placeholder-specifications)
13. [Timeline & Milestones](#12-timeline--milestones)
14. [Success Criteria](#13-success-criteria)
15. [Contact & Support](#14-contact--support)
16. [Appendices](#appendices)

---

## Executive Summary

This document provides comprehensive technical specifications to implement a 360-degree customer view within Dynamics 365 CRM for Devtraco Group. The implementation focuses on creating a unified customer profile that consolidates data from all touchpoints including sales, service, property management, finance, and client interactions.

**Priority:** High - This is the foundation for all future CX automation and client experience improvements.

---

## 1. Implementation Scope

### 1.1 What to Build

| Component | Description | Priority |
|-----------|-------------|----------|
| **Customer Data Model** | Extend existing Contact/Account entities with new fields | Critical |
| **New Custom Entities** | Create Visit, Loyalty, Snag, and Interaction entities | Critical |
| **Integration Points** | Set up data sync with Business Central, SharePoint, and other systems | Critical |
| **Dashboards** | Create 360-degree view dashboard for CE team | High |
| **Workflows** | Automate notifications, status updates, and document management | High |
| **Reporting** | Build key reports for management and SteerCo | Medium |

### 1.2 Assumptions

- Dynamics 365 CE is the source of truth for customer data
- Business Central is the source of truth for financial/transaction data
- All customizations will be done in a sandbox first, then deployed to production
- User acceptance testing will be conducted by the CX team
- Existing security roles will be extended to cover new entities

---

## 2. Entity Configuration Specifications

### 2.1 Extend Existing: Contact Entity

**Entity:** Contact (System Entity)

**New Fields to Add:**

| Field Name | Type | Description | Required | Validation |
|------------|------|-------------|----------|------------|
| `devtrac_customerid` | Single Line of Text (String) | BC Number - Primary Customer Identifier | Yes | Unique, Format: DEV-XXX-XXXXX |
| `devtrac_customertype` | Option Set | Customer Type | Yes | Options: Individual, Corporate, Joint |
| `devtrac_masterliststatus` | Option Set | Current workflow stage | Yes | Options: Prospect, Reservation, SPA Issued, SPA Executed, Handover Ready, Handover Complete |