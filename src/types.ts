/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logoColor: string;
  primaryColor: string;
  accentColor: string;
  currency: string;
  weightUnit: 'KG' | 'LBS';
  baseTariffsEnabled: boolean;
}

export interface Customer {
  id: string;
  name: string;
  taxId: string;
  address: string;
  creditLimit: number;
  paymentTerms: string;
  email: string;
  phone: string;
  activeQuotationsCount?: number;
}

export type LocationType = 'port' | 'depot' | 'customer' | 'warehouse';

export interface LocationGeo {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  lat: number;
  lng: number;
  zone: string;
  geofenceRadius: number; // in meters
}

export type VehicleType = 'skeletal' | 'flatbed' | 'sideloader' | 'tipper';
export type OwnerType = 'in-house' | 'subcontract';

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  ownerType: OwnerType;
  roadTaxExpiry: string;
  maintenanceAlert: boolean;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  portPassNumber: string;
  phone: string;
  assignedVehicleId: string;
  currentStatus: 'idle' | 'assigned' | 'in-transit' | 'at-site' | 'completed';
}

export type ScenarioType = 'IMP' | 'EXP' | 'Inland' | 'EMTY' | 'RETURN';
export type ContainerSizeCode = '20GP' | '40GP' | '40HC';

export interface SurchargeRule {
  code: string;
  name: string;
  amount: number;
  unit: string;
  autoTrigger: string;
}

export interface TariffRate {
  id: string;
  scenario: ScenarioType;
  fromZone: string;
  toZone: string;
  size: ContainerSizeCode;
  amount: number;
}

export interface QuotationRateItem {
  id: string;
  scenario: ScenarioType;
  fromLocationId: string;
  toLocationId: string;
  containerSize: ContainerSizeCode;
  baseRate: number;
  additionalSurcharges: Array<{
    code: string;
    amount: number;
  }>;
}

export interface Quotation {
  id: string;
  quoteNo: string;
  tenantId: string;
  customerId: string;
  status: 'draft' | 'confirmed' | 'expired';
  effectiveDate: string;
  expiryDate: string;
  rates: QuotationRateItem[];
  surcharges: SurchargeRule[];
  notes?: string;
  paymentTermsOverride?: string;
}

export type JobStatus = 'pending' | 'scheduled' | 'dispatched' | 'active' | 'completed';

export interface MilestoneStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  timestamp?: string;
  requiresEvidence: boolean;
  evidenceUrl?: string; // photo or signature
  signatureName?: string;
}

export interface Job {
  id: string;
  jobNo: string;
  tenantId: string;
  customerId: string;
  quotationId: string;
  rateItemId: string; // references the specific rate line in quotation
  scenario: ScenarioType;
  containerNo: string;
  sealNo: string;
  containerSize: ContainerSizeCode;
  weightKg: number;
  shippingLine: string;
  vesselName: string;
  voyageNo: string;
  eta: string;
  
  // Locations involved in trip
  originLocationId: string;
  destinationLocationId: string;
  emptyReturnLocationId?: string; // for IMP
  emptyPickupLocationId?: string; // for EXP
  
  status: JobStatus;
  driverId?: string;
  vehicleId?: string;
  scheduledTime?: string;
  
  // Execution Milestones
  milestones: MilestoneStep[];
  currentMilestoneIndex: number;
  
  // Dynamic Insertion
  hasDynamicInsertion: boolean;
  dynamicInsertedJobId?: string; // ID of the next linked task
  
  completionTime?: string;
  billingStatus?: 'pending' | 'invoiced';
  extraSurchargesIncurred: Array<{
    code: string;
    name: string;
    amount: number;
    reason: string;
  }>;
}

export interface ROT {
  id: string;
  jobId: string;
  rotNo: string;
  status: 'draft' | 'confirmed';
  gateReleaseCode: string;
  depotExpiry: string;
  verifiedBy?: string;
}

export interface ConsignmentNote {
  id: string;
  jobId: string;
  cnNo: string;
  status: 'draft' | 'issued' | 'signed';
  printed: boolean;
  recipientSignedBy?: string;
  signatureTimestamp?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  jobId: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'unpaid' | 'paid';
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  items: Array<{
    description: string;
    amount: number;
  }>;
}

export interface LiveTruckPosition {
  driverId: string;
  jobId: string;
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  etaMinutes: number;
  pathPercentage: number; // 0 to 100 for visual transition
  routePoints: Array<{ lat: number; lng: number }>;
  isReroutedForDynamicJob: boolean;
}

export type UserRole = 'administrator' | 'dispatcher' | 'billing' | 'driver_emulator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  assignedDriverId?: string;
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  type: string; // e.g., 'Port Sector', 'Inland Corridor', 'Industrial Hub'
  description: string;
}

export interface ZoneType {
  id: string;
  name: string;
  description: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  senderEmail: string;
  encryption: 'none' | 'ssl' | 'tls';
  active: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  triggerEvent: string; // "Job Booked" | "Milestone Update" | "Invoice Issued"
  subject: string;
  body: string;
  variables: string[];
}

export interface WorkflowMilestoneStepConfig {
  id: string;
  label: string;
  description: string;
  requiresEvidence: boolean;
}

export interface WorkflowMilestoneConfig {
  scenario: ScenarioType;
  steps: WorkflowMilestoneStepConfig[];
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customerId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'GIRO';
  refNo: string;
  notes?: string;
}

