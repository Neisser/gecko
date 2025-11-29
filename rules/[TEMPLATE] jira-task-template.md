help me translate this jira task into the template provided:

<Jira Task>
Description:
When generating the adhoc report titled "Onboarding Activity Name 4 is blank ISSUE", the report returns 10 records when no filters are applied. However, applying a filter on any of the following fields results in 0 records, when it should return 9 records:

Onboarding Activity 4 Name is blank

Onboarding Activity 4 Status is blank

Steps to Reproduce:

Go to the adhoc reporting module.

Generate the report titled "Onboarding Activity Name 4 is blank ISSUE" with no filters related with onboarding activity 4 → observe it returns 10 records.

Add any of the following filters:

Onboarding Activity 4 Name is blank

Onboarding Activity 4 Status is blank

Run the report again.

Actual Result:
The report returns 0 records, which is incorrect and suggests that blank/null values are not being properly evaluated by the filter.

Expected Result:
The report should return 9 records, as 9 of the original 10 rows have the respective fields in blank/null.
</Jira Task>

<Template>
# Jira Template Usage Examples for Conexis VMS

## Example 1: New Feature (using full template)

```markdown
# Add Multi-Select Date Range Filter to Adhoc Reports

## 📋 Task Overview
**Feature Name:** Adhoc Reports - Multi-Select Date Range Enhancement
**Epic/Component:** Others (Adhoc Module)
**Priority:** Medium
**Story Points:** 8

## 🎯 Business Context
**Problem Statement:** Users need to filter adhoc reports across multiple non-contiguous date ranges to analyze data patterns across different time periods.
**User Story:** As a Buyer Administrator, I want to select multiple date ranges in adhoc reports so that I can compare data across different quarters and months without running separate reports.

## 🏢 Tenant & Role Configuration
**Tenant Scope:**
- [x] All Tenants
- [ ] Specific Tenants: []
- [ ] Tenant-configurable feature

**Role Access:** [Check all applicable roles]
- [ ] **Global:** Super Administrator, Product Support
- [x] **MSP:** MSP Administrator, Program Manager, Program Representative, MSP Finance  
- [x] **Buyer:** Buyer Administrator, Recruiter, Hiring Manager, Approver, Buyer Finance, Delegate
- [ ] **Supplier:** Supplier Administrator, Account Manager, Supplier Finance
- [ ] **Worker:** Worker

**Permissions Required:**
- [x] View only
- [ ] Create/Edit
- [ ] Delete/Archive
- [ ] Approve/Reject
- [x] Export data
- [ ] Custom permission: []

## 🛠 Technical Requirements

### Backend (NestJS)
**Affected Modules:**
- [x] `src/modules/adhoc`
- [ ] Database migrations needed
- [ ] New Sequelize models
- [ ] Role guards updates: `adhoc.roles.ts`
- [ ] Tenant config changes

**API Endpoints:**
```
POST /api/adhoc/query - Enhanced to handle multi-date ranges in query parameters
```

### Frontend (Next.js)
**Affected Areas:**
- [x] `src/pages/home/adhoc`
- [x] `src/components/common/DateRangePicker`  
- [ ] Redux slice: ``
- [x] Service layer: `src/infrastructure/services/adhoc.ts`
- [x] Permission checking in UI

**Files to Focus On:**
- `back/conexis/src/modules/adhoc/services/adhoc.service.ts`
- `front/conexis/src/pages/home/adhoc/index.tsx`
- `front/conexis/src/components/common/DateRangePicker/DateRangePicker.tsx`
```

## Example 2: Bug Fix (using simple template)

```markdown
# Fix Supplier Finance Role Cannot View Contract Details

## 📋 Task Overview
**Feature/Fix:** Fix missing permissions for Supplier Finance role on contract details
**Module:** Contracts
**Type:** Bug

## 🏢 Scope
**Tenants:** All
**Roles:** Supplier Finance

## 🎯 Requirements
**What needs to be done:**
- [x] Add Supplier Finance role to contract readOne permissions
- [x] Update contract roles configuration
- [x] Verify UI shows contract details for Supplier Finance users

## 🛠 Technical Changes
**Backend:**
- [x] Module: `src/modules/contracts`
- [x] Files: `src/modules/contracts/roles/contracts.roles.ts`
- [x] Database changes: No

**Frontend:**
- [x] Pages: Contract detail pages
- [x] Components: Contract detail components
- [x] Services: No changes needed

## ✅ Acceptance Criteria
- [x] Supplier Finance can view contract details
- [x] Supplier Finance cannot edit/delete contracts
- [x] Role permissions work correctly
- [x] No regressions on other tenants

## 📝 Additional Notes
Related to issue where Supplier Finance users were getting 403 errors when clicking contract links from invoices.
```

## Example 3: Database Migration Task

```markdown
# Add SubEntity Support to Contracts Module

## 📋 Task Overview
**Feature/Fix:** Enable SubEntity selection in contract creation for Tenant 18
**Module:** Contracts
**Type:** Enhancement

## 🏢 Scope
**Tenants:** Specific: Surge Staffing (18)
**Roles:** MSP Admin, Program Manager, Buyer Admin

## 🎯 Requirements
**What needs to be done:**
- [x] Add SubEntity foreign key to contracts table
- [x] Update contract creation form to include SubEntity dropdown
- [x] Add SubEntity filtering to contract lists
- [x] Ensure tenant-specific feature toggle

## 🛠 Technical Changes
**Backend:**
- [x] Module: `src/modules/contracts`
- [x] Files: 
  - `src/modules/contracts/models/contracts.model.ts`
  - `src/modules/contracts/services/contracts.service.ts`
  - `src/modules/contracts/dto/createContract.dto.ts`
- [x] Database changes: Yes - Add id_subentity column to contracts table

**Frontend:**
- [x] Pages: `src/pages/home/contracts/create`
- [x] Components: `src/components/contracts/ContractForm`
- [x] Services: `src/infrastructure/services/contracts.ts`

## ✅ Acceptance Criteria
- [x] SubEntity dropdown appears only for Tenant 18
- [x] SubEntity is required when creating contracts for Tenant 18
- [x] Existing contracts show N/A for SubEntity if not set
- [x] Contract lists can be filtered by SubEntity
- [x] Role permissions work correctly
- [x] No regressions on other tenants

## 📝 Additional Notes
This feature follows the same pattern as other Tenant 18 specific features. Check subEntity.service.ts for reference on tenant validation.
```

## Quick Reference Guide

### When to use Full Template:
- New features with multiple components
- Changes affecting multiple modules
- Features requiring database changes
- Complex role/permission updates
- Multi-tenant considerations

### When to use Simple Template:
- Bug fixes
- Small enhancements
- Single file changes
- Quick configuration updates
- UI-only changes

### Key Sections to Always Fill:
1. **Tenant Scope** - Critical for this multitenant system
2. **Role Access** - Essential for RBAC compliance
3. **Technical Changes** - Helps with estimation and planning
4. **Acceptance Criteria** - Ensures testable requirements

### Common Module Patterns:
- **Jobs**: Usually affects submissions and contracts
- **Submissions**: Often touches contracts and jobs
- **Contracts**: May impact invoices and T&E
- **Invoices**: Usually connects to contracts and payments
- **Auth**: Affects all modules when roles change
- **Others**: BusinessUnits, CostCenter, GlCodes, WorkShifts 

</Template>

<Reference>
  
  # Conexis VMS - Quick Reference Cheat Sheet

  ## 🏢 Tenant IDs
  - **CalOptima**: 9 (Production tenant)
  - **Explore**: 13
  - **Contrax**: 14
  - **EcoWorkforce**: 15
  - **Quantum (L'Oreal)**: 16
  - **Surge Management**: 17
  - **Surge Staffing**: 18 (Has SubEntity features)
  - **Accenture**: 28

  ## 👥 Role Categories
  ### Global Roles
  - **Super Administrator** - Full system access
  - **Product Support** - Support team access

  ### MSP Roles (Service Provider)
  - **MSP Administrator** - Full MSP operations
  - **Program Manager** - Program oversight
  - **Program Representative** - Day-to-day operations
  - **MSP Finance** - Financial operations

  ### Buyer Roles (Client Company)
  - **Buyer Administrator** - Full buyer operations
  - **Recruiter** - Job posting and candidate sourcing
  - **Hiring Manager** - Hiring decisions
  - **Approver** - Approval workflows
  - **Buyer Finance** - Financial operations
  - **Delegate** - Limited hiring manager permissions

  ### Supplier Roles (Staffing Agency)
  - **Supplier Administrator** - Full supplier operations
  - **Account Manager** - Client relationship management
  - **Supplier Finance** - Financial operations

  ### Worker Role
  - **Worker** - Individual contractor/employee

  ## 📁 Common File Patterns
  ### Backend (NestJS)
  ```
  src/modules/[module-name]/
  ├── controllers/[module].controller.ts
  ├── services/[module].service.ts
  ├── models/[module].model.ts
  ├── dto/[action][Module].dto.ts
  ├── roles/[module].roles.ts
  └── [module].module.ts
  ```

  ### Frontend (Next.js)
  ```
  src/
  ├── pages/home/[module]/
  ├── components/[module]/
  ├── application/[module]Slice/
  ├── infrastructure/services/[module].ts
  └── consts/[module].ts
  ```

  ## 🔗 Module Dependencies
  - **Jobs** ↔ **Submissions** ↔ **Contracts**
  - **Contracts** → **Invoices** → **Payments**
  - **TimeAndExpense** → **Invoices**
  - **Auth** → All modules (permissions)
  - **Others** → Jobs, Contracts (BusinessUnits, CostCenter, etc.)

  ## 🚨 Critical Considerations
  1. **Always check tenant isolation** - Features may be tenant-specific
  2. **Verify role permissions** - Use existing .roles.ts files as reference
  3. **Database migrations** - Include proper tenant_id columns
  4. **UI permission checks** - Conditional rendering based on roles
  5. **Test across tenants** - Ensure no cross-tenant data leakage

  ## 📋 Template Selection Guide
  - **Full Template**: New features, multi-module changes, DB migrations
  - **Simple Template**: Bug fixes, single file changes, minor enhancements

  ## 💡 Pro Tips
  - Reference existing tenant-specific code (e.g., SubEntity for Tenant 18)
  - Check role permissions in existing modules for consistency
  - Use tenant configuration for feature toggles when possible
  - Always include regression testing for other tenants 

</Reference>

<Template Examples>

# Jira Template Usage Examples for Conexis VMS

## Example 1: New Feature (using full template)

```markdown
# Add Multi-Select Date Range Filter to Adhoc Reports

## 📋 Task Overview
**Feature Name:** Adhoc Reports - Multi-Select Date Range Enhancement
**Epic/Component:** Others (Adhoc Module)
**Priority:** Medium
**Story Points:** 8

## 🎯 Business Context
**Problem Statement:** Users need to filter adhoc reports across multiple non-contiguous date ranges to analyze data patterns across different time periods.
**User Story:** As a Buyer Administrator, I want to select multiple date ranges in adhoc reports so that I can compare data across different quarters and months without running separate reports.

## 🏢 Tenant & Role Configuration
**Tenant Scope:**
- [x] All Tenants
- [ ] Specific Tenants: []
- [ ] Tenant-configurable feature

**Role Access:** [Check all applicable roles]
- [ ] **Global:** Super Administrator, Product Support
- [x] **MSP:** MSP Administrator, Program Manager, Program Representative, MSP Finance  
- [x] **Buyer:** Buyer Administrator, Recruiter, Hiring Manager, Approver, Buyer Finance, Delegate
- [ ] **Supplier:** Supplier Administrator, Account Manager, Supplier Finance
- [ ] **Worker:** Worker

**Permissions Required:**
- [x] View only
- [ ] Create/Edit
- [ ] Delete/Archive
- [ ] Approve/Reject
- [x] Export data
- [ ] Custom permission: []

## 🛠 Technical Requirements

### Backend (NestJS)
**Affected Modules:**
- [x] `src/modules/adhoc`
- [ ] Database migrations needed
- [ ] New Sequelize models
- [ ] Role guards updates: `adhoc.roles.ts`
- [ ] Tenant config changes

**API Endpoints:**
```
POST /api/adhoc/query - Enhanced to handle multi-date ranges in query parameters
```

### Frontend (Next.js)
**Affected Areas:**
- [x] `src/pages/home/adhoc`
- [x] `src/components/common/DateRangePicker`  
- [ ] Redux slice: ``
- [x] Service layer: `src/infrastructure/services/adhoc.ts`
- [x] Permission checking in UI

**Files to Focus On:**
- `back/conexis/src/modules/adhoc/services/adhoc.service.ts`
- `front/conexis/src/pages/home/adhoc/index.tsx`
- `front/conexis/src/components/common/DateRangePicker/DateRangePicker.tsx`
```

## Example 2: Bug Fix (using simple template)

```markdown
# Fix Supplier Finance Role Cannot View Contract Details

## 📋 Task Overview
**Feature/Fix:** Fix missing permissions for Supplier Finance role on contract details
**Module:** Contracts
**Type:** Bug

## 🏢 Scope
**Tenants:** All
**Roles:** Supplier Finance

## 🎯 Requirements
**What needs to be done:**
- [x] Add Supplier Finance role to contract readOne permissions
- [x] Update contract roles configuration
- [x] Verify UI shows contract details for Supplier Finance users

## 🛠 Technical Changes
**Backend:**
- [x] Module: `src/modules/contracts`
- [x] Files: `src/modules/contracts/roles/contracts.roles.ts`
- [x] Database changes: No

**Frontend:**
- [x] Pages: Contract detail pages
- [x] Components: Contract detail components
- [x] Services: No changes needed

## ✅ Acceptance Criteria
- [x] Supplier Finance can view contract details
- [x] Supplier Finance cannot edit/delete contracts
- [x] Role permissions work correctly
- [x] No regressions on other tenants

## 📝 Additional Notes
Related to issue where Supplier Finance users were getting 403 errors when clicking contract links from invoices.
```

## Example 3: Database Migration Task

```markdown
# Add SubEntity Support to Contracts Module

## 📋 Task Overview
**Feature/Fix:** Enable SubEntity selection in contract creation for Tenant 18
**Module:** Contracts
**Type:** Enhancement

## 🏢 Scope
**Tenants:** Specific: Surge Staffing (18)
**Roles:** MSP Admin, Program Manager, Buyer Admin

## 🎯 Requirements
**What needs to be done:**
- [x] Add SubEntity foreign key to contracts table
- [x] Update contract creation form to include SubEntity dropdown
- [x] Add SubEntity filtering to contract lists
- [x] Ensure tenant-specific feature toggle

## 🛠 Technical Changes
**Backend:**
- [x] Module: `src/modules/contracts`
- [x] Files: 
  - `src/modules/contracts/models/contracts.model.ts`
  - `src/modules/contracts/services/contracts.service.ts`
  - `src/modules/contracts/dto/createContract.dto.ts`
- [x] Database changes: Yes - Add id_subentity column to contracts table

**Frontend:**
- [x] Pages: `src/pages/home/contracts/create`
- [x] Components: `src/components/contracts/ContractForm`
- [x] Services: `src/infrastructure/services/contracts.ts`

## ✅ Acceptance Criteria
- [x] SubEntity dropdown appears only for Tenant 18
- [x] SubEntity is required when creating contracts for Tenant 18
- [x] Existing contracts show N/A for SubEntity if not set
- [x] Contract lists can be filtered by SubEntity
- [x] Role permissions work correctly
- [x] No regressions on other tenants

## 📝 Additional Notes
This feature follows the same pattern as other Tenant 18 specific features. Check subEntity.service.ts for reference on tenant validation.
```

## Quick Reference Guide

### When to use Full Template:
- New features with multiple components
- Changes affecting multiple modules
- Features requiring database changes
- Complex role/permission updates
- Multi-tenant considerations

### When to use Simple Template:
- Bug fixes
- Small enhancements
- Single file changes
- Quick configuration updates
- UI-only changes

### Key Sections to Always Fill:
1. **Tenant Scope** - Critical for this multitenant system
2. **Role Access** - Essential for RBAC compliance
3. **Technical Changes** - Helps with estimation and planning
4. **Acceptance Criteria** - Ensures testable requirements

### Common Module Patterns:
- **Jobs**: Usually affects submissions and contracts
- **Submissions**: Often touches contracts and jobs
- **Contracts**: May impact invoices and T&E
- **Invoices**: Usually connects to contracts and payments
- **Auth**: Affects all modules when roles change
- **Others**: BusinessUnits, CostCenter, GlCodes, WorkShifts 
</Template Example>
