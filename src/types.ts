/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Region {
  id: string;
  name: string;
  code: string;
  description?: string;
  country?: string;
  currency?: string;
  currencySymbol?: string;
  timezone?: string;
  dateFormat?: string;
  taxLabel?: string;
  taxRate?: number;
  primaryLanguage?: string;
  secondaryLanguage?: string;
  govtRefFields?: string[];
  freeTimeDays?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Country {
  id: string;
  name: string;
  code: string; // ISO 2-letter code
  regionId: string; // Foreign key referencing Region
  currency: string;
  taxRate: number; // Tax percentage (e.g., 9 for 9%)
}

export interface InvoiceSettings {
  id: string;
  regionId: string;
  invoicePrefix: string;       // e.g. "INV-IN", "INV-AE"
  currentSequence: number;     // auto-increments per invoice
  defaultPaymentTerms: string; // e.g. "Net 30"
  defaultDueDays: number;      // e.g. 30
  taxLabel: string;            // pulled from region but overridable
  taxRate: number;             // pulled from region but overridable
  showTaxBreakdown: boolean;
  footerNote: string;
  bankName: string;
  bankAccountNo: string;
  bankSwiftCode: string;
  autoCreateOnJobClose: boolean;
  requireApprovalBeforeSend: boolean;
}

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
  reportingCurrency?: string; // default "USD"
}

export interface Customer {
  id: string;
  regionId?: string;
  name: string;
  taxId: string;
  address: string;
  creditLimit: number;
  paymentTerms: string;
  email: string;
  phone: string;
  activeQuotationsCount?: number;
  countryId?: string; // Foreign key referencing Country (enforces regional scoping)
  status?: 'draft' | 'pending_global_approval' | 'approved' | 'rejected'; // Approval workflow state
  rejectionReason?: string; // Optional feedback when global admin rejects regional request
}

export type LocationType = 'port' | 'depot' | 'customer' | 'warehouse';

export interface LocationGeo {
  id: string;
  regionId?: string;
  name: string;
  code: string;
  unLocode: string; // The international 5-character UN/LOCODE standard representation (e.g. USLAX, SGPIN)
  type: LocationType;
  lat: number;
  lng: number;
  zone: string;
  geofenceRadius: number; // in meters
  countryId?: string; // Links back to dynamic Country registry
}

export type VehicleType = 'skeletal' | 'flatbed' | 'sideloader' | 'tipper';
export type OwnerType = 'in-house' | 'subcontract';

export interface Vehicle {
  id: string;
  regionId?: string;
  plateNumber: string;
  type: VehicleType;
  ownerType: OwnerType;
  roadTaxExpiry: string;
  maintenanceAlert: boolean;
  status?: 'idle' | 'active' | 'maintenance';
}

export interface Driver {
  id: string;
  regionId?: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  portPassNumber: string;
  phone: string;
  assignedVehicleId: string;
  currentStatus: 'idle' | 'assigned' | 'in-transit' | 'at-site' | 'completed';
}

export type ScenarioType = 'IMP' | 'EXP' | 'Inland' | 'EMTY' | 'RETURN';
export type ContainerSizeCode = string;

export interface SurchargeRule {
  id: string;
  code: string;           // e.g. "FAF", "DET", "WAIT"
  name: string;           // e.g. "Fuel Adjustment Factor"
  category: "Fuel" | "Detention" | "Waiting Time" | 
            "Port Fee" | "Chassis" | "Other";
  calculationMethod: "Flat" | "Per Hour" | "Per Day" | 
                     "Percentage of Base" | "Tiered";
  amount: number;         // base amount or percentage
  currency: string;       // e.g. "INR", "AED"
  freePeriod: number;     // free units before charge kicks in
  freePeriodUnit: "Hours" | "Days" | "None";
  maxChargeCap: number | null;  // max chargeable amount, null = no cap
  applicableScenarios: ScenarioType[];  // which scenarios this applies
  applicableShippingLines: string[];    // shipping line ids, empty = all lines
  autoTrigger: boolean;   // auto-apply to invoice or manual only
  autoTriggerCondition: string;  // human readable condition description
  billToCustomer: boolean;       // show on customer invoice
  payToSubcontractor: boolean;   // also create subcontractor payment line
  subcontractorAmount: number;   // amount to pay subcontractor (buy rate)
  regionId: string;
  isActive: boolean;
  createdAt: string;
}

export interface TariffRate {
  id: string;
  regionId?: string;
  scenario: ScenarioType;
  fromZone: string;
  toZone: string;
  size: ContainerSizeCode;
  amount: number;
}

export type QuotationRateItem = {
  id: string;
  containerType: string;    // e.g. "40HC"
  containerTypeId: string;  // from ContainerType master
  originZoneId: string;
  destinationZoneId: string;
  originLocationId?: string;  // if point-to-point
  destinationLocationId?: string;
  baseRate: number;
  currency: string;
  returnLegRate: number;    // captured at quote time
  returnLocationId?: string; // designated return depot
  estimatedFuelSurcharge: number;  // FAF amount
  applicableSurcharges: {
    surchargeCode: string;
    surchargeName: string;
    amount: number;
    calculationMethod: string;
    isIncluded: boolean;    // included in base or extra
  }[];
  totalEstimatedValue: number;
  rotRequired: boolean;     // per scenario logic
  notes: string;
}

export type Quotation = {
  id: string;
  quoteNo: string;          // e.g. "QT-IN-2026-0001"
  regionId: string;
  customerId: string;
  scenario: ScenarioType;
  status: "draft" | "pending_approval" | 
          "confirmed" | "expired" | "superseded"
  validFrom: string;
  validTo: string;
  rateItems: QuotationRateItem[];  
  // one per container type / route combination
  totalValue: number;       // sum of all rate items
  currency: string;
  internalNotes: string;
  customerNotes: string;    // printed on quote PDF
  createdBy: string;        // user id
  confirmedBy?: string;
  confirmedAt?: string;
  clonedFromId?: string;    // if cloned
  createdAt: string;
  updatedAt: string;
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
  regionId?: string;
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
  freeTimeExpiry?: string;
  billingStatus?: 'pending' | 'invoiced';
  extraSurchargesIncurred: Array<{
    code: string;
    name: string;
    amount: number;
    reason: string;
  }>;

  // Demurrage/Detention tracking
  gateOutTimestamp?: string;
  gateInTimestamp?: string;
  freeTimeDays?: number;
  detentionLiability?: "customer" | "company" | "disputed" | null;
  detentionChargeAmount?: number;
  detentionNotes?: string;
}

export interface ROT {
  id: string;
  regionId?: string;
  jobId: string;
  rotNo: string;
  status: 'draft' | 'confirmed';
  gateReleaseCode: string;
  depotExpiry: string;
  verifiedBy?: string;
}

export interface ConsignmentNote {
  id: string;
  regionId?: string;
  jobId: string;
  cnNo: string;
  status: 'draft' | 'issued' | 'signed';
  printed: boolean;
  recipientSignedBy?: string;
  signatureTimestamp?: string;
}

export interface Invoice {
  id: string;
  regionId: string;
  invoiceNo: string;
  invoiceNumber: string;    // formatted e.g. "INV-IN-2026-0001"
  jobId: string;
  customerId: string;
  quotationId?: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "approved" | "sent" | "paid" | "unpaid" | "overdue" | "cancelled";
  subTotal: number;         // before tax
  taxLabel: string;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;      // subTotal + taxAmount
  currency: string;
  surchargeLines: {
    surchargeCode: string;
    description: string;
    amount: number;
    billToCustomer: boolean;
  }[];
  costLines: {              // subcontractor costs (buy rates)
    description: string;
    amount: number;
  }[];
  grossMargin: number;      // totalAmount - sum of costLines
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  notes: string;
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

export type UserRole = 'administrator' | 'region_admin' | 'dispatcher' | 'billing' | 'driver_emulator' | 'operations' | 'driver';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  assignedDriverId?: string;
  regionId: string | null;
  regionAccess: string[];
  userLevel: "corporate_admin" | "region_admin" | "region_user" | "driver";
}

export interface Zone {
  id: string;
  regionId?: string;
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

export interface ShippingLine {
  id: string;
  name: string;
  scacCode: string;      // Standard Carrier Alpha Code e.g. "MAEU"
  shortCode: string;     // e.g. "Maersk"
  logoColor: string;     // hex for UI badge
  freeTimeDays: number;  // default free time before detention
  detentionRatePerDay: number;
  currency: string;
  regionId?: string;
  isActive: boolean;
}

export interface Vessel {
  id: string;
  vesselName: string;
  imoNumber: string;     // International Maritime Org number
  shippingLineId: string;
  flag: string;          // country flag e.g. "Panama"
  vesselType: string;    // "Container Ship", "Feeder" etc
  isActive: boolean;
}

export interface Vendor {
  id: string;
  vendorName: string;
  vendorCode: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  regionId?: string;
  taxId: string;
  paymentTerms: string;
  specialization: string; // "Haulage", "Customs", "Both"
  isActive: boolean;
}

export interface ContainerType {
  id: string;
  code: string;          // e.g. "40HC"
  name: string;          // e.g. "40ft High Cube"
  isoCode: string;       // ISO 6346 type code e.g. "45G1"
  lengthFt: number;
  heightFt: number;
  tareWeightKg: number;
  maxPayloadKg: number;
  category: "Dry" | "Reefer" | "Flat Rack" | "Open Top" | "Tank"
  isActive: boolean;
}

export interface SupportedLanguage {
  id: string;
  code: string;         // e.g. "ta", "ar", "ms", "fr"
  name: string;         // e.g. "Tamil", "Arabic", "Bahasa Melayu"
  nativeName: string;   // e.g. "தமிழ்", "العربية", "Bahasa"
  isRTL: boolean;       // Arabic = true, others = false
  isActive: boolean;
}

export interface TranslationEntry {
  id: string;
  languageCode: string;   // e.g. "ta"
  category: "document_field" | "status_label" | "milestone_label" | "surcharge_name" | "ui_label" | "email_template";
  key: string;            // e.g. "consignee", "shipper", "gross_weight"
  englishValue: string;   // e.g. "Consignee"
  translatedValue: string; // e.g. "பெறுநர்" (Tamil)
  documentType?: string;  // "CN", "ROT", "Invoice", "ALL"
  isVerified: boolean;    // human verified vs auto-translated
}

export interface MasterTranslation {
  id: string;
  languageCode: string;
  masterType: "container_type" | "vendor" | "milestone" | "surcharge" | "zone_type" | "location_type";
  masterRecordId: string;
  translatedName?: string;
  translatedLabel?: string;
  translatedDescription?: string;
  translatedTriggerDesc?: string;
  isVerified: boolean;
  updatedAt: string;
}


