# Plan Edit Dialog - Complete Implementation Summary

## Changes Made

### 1. **planApiSlice.ts** - API Integration
- ✅ Added `UpdatePlanRequest` interface with fields matching the backend API
- ✅ Added `useUpdatePlanMutation` hook for calling `/activity/updateplan` endpoint
- ✅ Added ID fields (`chmDomainId`, `chmSubDomainId`) to `PlanViewRow` interface

**API Payload Structure:**
```typescript
{
  actorUserId: number;
  planId: number;
  planType: string;
  status: string;
  chmDomainId: number;        // Domain ID from dropdown
  chmSubDomain: number;        // SubDomain ID from dropdown
  networkDomain: string;       // Maps to 'domain' field
  layer: string;
  planVendor: string;          // Maps to 'vendorOem' field
  changeImpact: string;        // "SA" or "NSA"
}
```

### 2. **PlanEditDialog.tsx** - Updated Component
- ✅ Added `FilterOption` interface for dropdown options
- ✅ Added `chmDomainOptions` and `chmSubDomainOptions` props
- ✅ Integrated `useUpdatePlanMutation` hook
- ✅ Added dropdown rendering logic for:
  - **chmDomain** - Uses domain options from OrgHierarchyFilters
  - **chmSubDomain** - Uses subDomain options from OrgHierarchyFilters
  - **changeImpact** - Fixed values: "SA" and "NSA"
- ✅ Implemented `handleSaveClick` with API integration
- ✅ Added loading state with CircularProgress during save
- ✅ Text fields remain for non-dropdown fields

**Dropdown Flow:**
```
chmDomain field → stored as chmDomainId in form
chmSubDomain field → stored as chmSubDomainId in form
changeImpact field → stored as-is (SA or NSA)
```

### 3. **PlanViewTable.tsx** - Props Update
- ✅ Updated `Props` interface to include:
  - `chmDomainOptions?: FilterOption[]`
  - `chmSubDomainOptions?: FilterOption[]`
- ✅ Fixed delete button icon import (changed from `Delete` to `DeleteIcon`)
- ✅ Updated `renderRowActions` to properly display edit/delete buttons
- ✅ Pass options to `PlanEditDialog` component

### 4. **PlanViewAndSetup.tsx** - Data Flow
- ✅ Pass dropdown options from `useOrgHierarchyFilters` hook to `PlanViewTable`
- ✅ Options automatically filtered based on current hierarchy selection

**Data Flow:**
```
useOrgHierarchyFilters (hook)
    ↓
options.domain → chmDomainOptions
options.subDomain → chmSubDomainOptions
    ↓
PlanViewTable
    ↓
PlanEditDialog (uses for dropdown rendering)
```

## Field Mapping in Edit Dialog

| UI Field | Data Key | Type | Source |
|----------|----------|------|--------|
| CHM Domain | chmDomainId | Dropdown | OrgHierarchyFilters |
| CHM SubDomain | chmSubDomainId | Dropdown | OrgHierarchyFilters |
| Change Impact | changeImpact | Dropdown | Fixed: "SA", "NSA" |
| Plan Type | planType | Text | Read-only |
| Status | status | Text | Editable |
| Domain | domain | Text | Editable |
| Layer | layer | Text | Editable |
| Vendor / OEM | vendorOem | Text | Editable |
| Created At | createdAt | Text | Read-only |
| Updated At | updatedAt | Text | Read-only |
| Created By | createdBy | Text | Read-only |

## Read-Only Fields
- `id`
- `planId`
- `createdAt`
- `updatedAt`
- `createdBy`

## Backend Integration

### Update Plan Endpoint
**URL:** `POST /activity/updateplan`

**Request Body:**
```json
{
  "actorUserId": 1001,
  "planId": 123,
  "planType": "IMPLEMENTATION",
  "status": "ACTIVE",
  "chmDomainId": 10,
  "chmSubDomain": 20,
  "networkDomain": "Core",
  "layer": "L3",
  "planVendor": "Cisco",
  "changeImpact": "SA"
}
```

## User Experience

1. User clicks "Edit" icon on a plan row
2. Edit Dialog opens with current plan data
3. User can modify:
   - Text fields: Plan details, Domain, Layer, Vendor
   - Dropdowns: CHM Domain, CHM SubDomain, Change Impact
4. Read-only fields show existing values (disabled)
5. Click "Save Changes" to submit update
6. Loading spinner appears during API call
7. Success: Dialog closes, table updates
8. Error: Logged to console (can be enhanced with toast)

## Dependencies
- Material-UI components (Dialog, MenuItem, TextField, etc.)
- Redux Toolkit (for RTK Query mutations)
- authStorage (for getting current user ID)
- useOrgHierarchyFilters (for dropdown options)

## Testing Checklist
- [ ] Dropdowns populate with correct options
- [ ] Selected values are displayed correctly
- [ ] Save button calls API with correct payload
- [ ] Loading state shows during save
- [ ] Dialog closes on successful save
- [ ] Read-only fields cannot be modified
- [ ] Validate dropdown values map to correct IDs
