/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, Customer, LocationGeo, Vehicle, Driver, SurchargeRule, TariffRate, Quotation, Job, MilestoneStep, ScenarioType, ROT, ConsignmentNote, Zone, ZoneType, User, SmtpConfig, EmailTemplate, Region, Country, ShippingLine, Vessel, Vendor, ContainerType, InvoiceSettings, SupportedLanguage, TranslationEntry, CustomerPayment, VendorPayment } from './types';

export const INITIAL_REGIONS: Region[] = [
  { 
    id: 'reg-india', 
    name: 'India Operations', 
    code: 'IN', 
    description: 'Chennai, Mumbai, and New Delhi national haulage ops',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'GST',
    taxRate: 18,
    primaryLanguage: 'English',
    secondaryLanguage: 'Tamil',
    govtRefFields: ['E-way Bill No', 'BOE No', 'GSTIN No'],
    freeTimeDays: 7,
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z'
  },
  { 
    id: 'reg-uae', 
    name: 'UAE Operations', 
    code: 'UAE', 
    description: 'Jebel Ali and Dubai Port free trade logistics zones',
    country: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'AED',
    timezone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'VAT',
    taxRate: 5,
    primaryLanguage: 'English',
    secondaryLanguage: 'Arabic',
    govtRefFields: ['Customs Dec No', 'Gate Pass Ref'],
    freeTimeDays: 5,
    isActive: true,
    createdAt: '2026-02-10T10:30:00Z'
  },
  { 
    id: 'reg-uk', 
    name: 'United Kingdom Ops', 
    code: 'UK', 
    description: 'Felixstowe and Southampton UK/EU channel trucking',
    country: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    timezone: 'Europe/London',
    dateFormat: 'DD-MM-YYYY',
    taxLabel: 'VAT',
    taxRate: 20,
    primaryLanguage: 'English',
    secondaryLanguage: 'French',
    govtRefFields: ['MRN Reference', 'EORI Number'],
    freeTimeDays: 4,
    isActive: true,
    createdAt: '2026-03-01T09:15:00Z'
  },
  { 
    id: 'reg-malaysia', 
    name: 'Malaysia Operations', 
    code: 'MY', 
    description: 'Port Klang and Penang regional feeder operations',
    country: 'Malaysia',
    currency: 'MYR',
    currencySymbol: 'RM',
    timezone: 'Asia/Kuala_Lumpur',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'SST',
    taxRate: 6,
    primaryLanguage: 'English',
    secondaryLanguage: 'Malay',
    govtRefFields: ['K1 Custom Form', 'EDI Gate Pass'],
    freeTimeDays: 6,
    isActive: false,
    createdAt: '2026-04-12T14:20:00Z'
  }
];

export const INITIAL_COUNTRIES: Country[] = [
  { id: 'cnt-us', name: 'United States', code: 'US', regionId: 'reg-amer', currency: 'USD', taxRate: 8.0 },
  { id: 'cnt-sg', name: 'Singapore', code: 'SG', regionId: 'reg-apac', currency: 'SGD', taxRate: 9.0 },
  { id: 'cnt-de', name: 'Germany', code: 'DE', regionId: 'reg-emea', currency: 'EUR', taxRate: 19.0 },
  { id: 'cnt-br', name: 'Brazil', code: 'BR', regionId: 'reg-latam', currency: 'BRL', taxRate: 12.0 },
  { id: 'cnt-in', name: 'India', code: 'IN', regionId: 'reg-apac', currency: 'INR', taxRate: 18.0 }
];

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Atlas Container Lines',
    subdomain: 'atlas-haulage',
    logoColor: '#f97316', // Amber-500
    primaryColor: '#0f172a', // Slate-900
    accentColor: '#f97316',
    currency: 'USD',
    weightUnit: 'KG',
    baseTariffsEnabled: true,
    reportingCurrency: "USD",
    onboardingStatus: { companyProfile: false, firstRegion: false, smtp: false, firstRegionAdmin: false },
    onboardingComplete: false
  },
  {
    id: 'tenant-2',
    name: 'Pacific Cargo Logistics',
    subdomain: 'pacific-haulage',
    logoColor: '#0ea5e9', // Sky-500
    primaryColor: '#022c22', // Emerald-950
    accentColor: '#0ea5e9',
    currency: 'SGD',
    weightUnit: 'KG',
    baseTariffsEnabled: true,
    reportingCurrency: "USD",
    onboardingStatus: { companyProfile: true, firstRegion: true, smtp: true, firstRegionAdmin: true },
    onboardingComplete: true
  },
  {
    id: 'tenant-3',
    name: 'EuroExpress Haulier',
    subdomain: 'euro-express',
    logoColor: '#a855f7', // Purple-500
    primaryColor: '#1e1b4b', // Indigo-950
    accentColor: '#a855f7',
    currency: 'EUR',
    weightUnit: 'LBS',
    baseTariffsEnabled: false,
    reportingCurrency: "USD",
    onboardingStatus: { companyProfile: true, firstRegion: true, smtp: true, firstRegionAdmin: true },
    onboardingComplete: true
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    regionId: 'IN',
    name: 'Pacific Furniture Co.',
    taxId: 'TX-992182-A',
    address: '25 East industrial Boulevard, Zone 4',
    creditLimit: 50000,
    paymentTerms: 'Net 30',
    email: 'billing@pacificfurniture.com',
    phone: '+1 (555) 234-5678',
    countryId: 'cnt-us',
    status: 'approved'
  },
  {
    id: 'cust-2',
    regionId: 'IN',
    name: 'Zenith Electronics Ltd.',
    taxId: 'TX-105541-E',
    address: 'High Tech Park, West Section, Bldg 8',
    creditLimit: 75000,
    paymentTerms: 'Net 15',
    email: 'logistics@zenithelec.co',
    phone: '+1 (555) 876-5432',
    countryId: 'cnt-sg',
    status: 'approved'
  },
  {
    id: 'cust-3',
    regionId: 'IN',
    name: 'Apex Agricultural Silos',
    taxId: 'TX-440239-X',
    address: 'Grain Docks Road, Wharf Sector B',
    creditLimit: 30000,
    paymentTerms: 'Net 45',
    email: 'import-team@apexagri.com',
    phone: '+1 (555) 345-6789',
    countryId: 'cnt-us',
    status: 'approved'
  },
  {
    id: 'cust-4',
    regionId: 'IN',
    name: 'Chennai Port Logistics Ltd',
    taxId: 'GSTIN-33AAACP8',
    address: '4, Rajaji Salai, Chennai Port, Tamil Nadu 600001',
    creditLimit: 120000,
    paymentTerms: 'Net 30',
    email: 'finance@chennaiportlog.co.in',
    phone: '+91 44 2536 1139',
    countryId: 'cnt-in',
    status: 'approved'
  },
  {
    id: 'cust-5',
    regionId: 'IN',
    name: 'Hindustan Container Services',
    taxId: 'GSTIN-27AAICH9',
    address: 'JNPT Logistics Park, Uran, Navi Mumbai, Maharashtra 400702',
    creditLimit: 90000,
    paymentTerms: 'Net 15',
    email: 'ops@hindustancontainer.in',
    phone: '+91 22 2724 5022',
    countryId: 'cnt-in',
    status: 'pending_global_approval'
  },
  {
    id: 'cust-6',
    regionId: 'IN',
    name: 'Punjab Agri Exporters Co',
    taxId: 'GSTIN-03AAAPA1',
    address: 'Industrial Focal Point, Phase IV, Ludhiana, Punjab 141010',
    creditLimit: 45000,
    paymentTerms: 'COD',
    email: 'export@punjabagri.com',
    phone: '+91 161 501 2490',
    countryId: 'cnt-in',
    status: 'draft'
  }
];

export const MOCK_LOCATIONS: LocationGeo[] = [
  {
    id: 'loc-port-1',
    regionId: 'IN',
    name: 'Terminal 1, Pasir Panjang Hub',
    code: 'SGPIN-T1',
    unLocode: 'SGPIN',
    type: 'port',
    lat: 80,
    lng: 320,
    zone: 'Zone A (Port Area)',
    geofenceRadius: 500,
    countryId: 'cnt-sg'
  },
  {
    id: 'loc-port-2',
    regionId: 'IN',
    name: 'Terminal 2, South Port Gate',
    code: 'SGPIN-SG2',
    unLocode: 'SGPIN',
    type: 'port',
    lat: 90,
    lng: 480,
    zone: 'Zone A (Port Area)',
    geofenceRadius: 500,
    countryId: 'cnt-sg'
  },
  {
    id: 'loc-depot-1',
    regionId: 'IN',
    name: 'Apex Empty Container Pool',
    code: 'SGPIN-APX',
    unLocode: 'SGPIN',
    type: 'depot',
    lat: 340,
    lng: 520,
    zone: 'Zone B (Inland East)',
    geofenceRadius: 300,
    countryId: 'cnt-sg'
  },
  {
    id: 'loc-depot-2',
    regionId: 'IN',
    name: 'LA Harbor Empty Depot',
    code: 'USLAX-ECE',
    unLocode: 'USLAX',
    type: 'depot',
    lat: 480,
    lng: 150,
    zone: 'Zone C (North Coast)',
    geofenceRadius: 300,
    countryId: 'cnt-us'
  },
  {
    id: 'loc-cust-1',
    regionId: 'IN',
    name: 'Pacific Furniture WH 1',
    code: 'USLAX-PF1',
    unLocode: 'USLAX',
    type: 'customer',
    lat: 280,
    lng: 160,
    zone: 'Zone D (West Industrial)',
    geofenceRadius: 200,
    countryId: 'cnt-us'
  },
  {
    id: 'loc-cust-2',
    regionId: 'IN',
    name: 'Zenith Electronics Main Plant',
    code: 'DEHAM-ZNT',
    unLocode: 'DEHAM',
    type: 'customer',
    lat: 500,
    lng: 380,
    zone: 'Zone E (East Corridor)',
    geofenceRadius: 250,
    countryId: 'cnt-de'
  },
  {
    id: 'loc-cust-3',
    regionId: 'IN',
    name: 'Santos Sugar Storage Hub',
    code: 'BRSSZ-AAH',
    unLocode: 'BRSSZ',
    type: 'customer',
    lat: 180,
    lng: 480,
    zone: 'Zone F (Southern Basin)',
    geofenceRadius: 400,
    countryId: 'cnt-br'
  }
];

export const DEFAULT_VEHICLES: Vehicle[] = [
  { id: 'veh-1', regionId: 'IN', plateNumber: 'PM-8821-X', type: 'skeletal', ownerType: 'in-house', roadTaxExpiry: '2026-11-20', maintenanceAlert: false },
  { id: 'veh-2', regionId: 'IN', plateNumber: 'PM-5044-Y', type: 'flatbed', ownerType: 'in-house', roadTaxExpiry: '2026-08-14', maintenanceAlert: false },
  { id: 'veh-3', regionId: 'IN', plateNumber: 'PM-1033-A', type: 'sideloader', ownerType: 'subcontract', roadTaxExpiry: '2027-02-10', maintenanceAlert: true },
  { id: 'veh-4', regionId: 'IN', plateNumber: 'PM-4541-W', type: 'tipper', ownerType: 'in-house', roadTaxExpiry: '2026-10-05', maintenanceAlert: false },
  { id: 'veh-5', regionId: 'IN', plateNumber: 'PM-3312-Z', type: 'skeletal', ownerType: 'subcontract', roadTaxExpiry: '2026-12-01', maintenanceAlert: false }
];

export const DEFAULT_DRIVERS: Driver[] = [
  { id: 'drv-1', regionId: 'IN', name: 'Bob Johnson', licenseNumber: 'DL-992019A', licenseExpiry: '2028-04-12', portPassNumber: 'PP-882-X', phone: '+1 (555) 123-0101', assignedVehicleId: 'veh-1', currentStatus: 'idle' },
  { id: 'drv-2', regionId: 'IN', name: 'Alice Smith', licenseNumber: 'DL-441029B', licenseExpiry: '2027-09-30', portPassNumber: 'PP-102-Y', phone: '+1 (555) 123-0202', assignedVehicleId: 'veh-2', currentStatus: 'idle' },
  { id: 'drv-3', regionId: 'IN', name: 'Charles Lee', licenseNumber: 'DL-301142C', licenseExpiry: '2030-01-15', portPassNumber: 'PP-334-A', phone: '+1 (555) 123-0303', assignedVehicleId: 'veh-3', currentStatus: 'idle' },
  { id: 'drv-4', regionId: 'IN', name: 'David Miller', licenseNumber: 'DL-770421D', licenseExpiry: '2026-06-18', portPassNumber: 'PP-454-W', phone: '+1 (555) 123-0404', assignedVehicleId: 'veh-4', currentStatus: 'idle' },
  { id: 'drv-5', regionId: 'IN', name: 'Eliza Watson', licenseNumber: 'DL-229988E', licenseExpiry: '2029-11-25', portPassNumber: 'PP-901-Z', phone: '+1 (555) 123-0505', assignedVehicleId: 'veh-5', currentStatus: 'idle' }
];

export const SURCHARGE_CATALOG: SurchargeRule[] = [
  {
    id: 'surch-faf',
    code: 'FAF',
    name: 'Fuel Adjustment Factor',
    category: 'Fuel',
    calculationMethod: 'Percentage of Base',
    amount: 12,
    currency: 'INR',
    freePeriod: 0,
    freePeriodUnit: 'None',
    maxChargeCap: null,
    applicableScenarios: ['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'],
    applicableShippingLines: [],
    autoTrigger: true,
    autoTriggerCondition: 'Always applied on all quotations',
    billToCustomer: true,
    payToSubcontractor: false,
    subcontractorAmount: 0,
    regionId: 'IN',
    isActive: true,
    createdAt: '2026-06-10T00:00:00Z'
  },
  {
    id: 'surch-det',
    code: 'DET',
    name: 'Detention Charge',
    category: 'Detention',
    calculationMethod: 'Per Day',
    amount: 5000,
    currency: 'INR',
    freePeriod: 7,
    freePeriodUnit: 'Days',
    maxChargeCap: null,
    applicableScenarios: ['IMP', 'EXP'],
    applicableShippingLines: [],
    autoTrigger: true,
    autoTriggerCondition: 'Triggered when container not returned within free time days',
    billToCustomer: true,
    payToSubcontractor: false,
    subcontractorAmount: 0,
    regionId: 'IN',
    isActive: true,
    createdAt: '2026-06-10T00:00:00Z'
  },
  {
    id: 'surch-wait',
    code: 'WAIT',
    name: 'Waiting Time',
    category: 'Waiting Time',
    calculationMethod: 'Per Hour',
    amount: 1000,
    currency: 'INR',
    freePeriod: 2,
    freePeriodUnit: 'Hours',
    maxChargeCap: 8000,
    applicableScenarios: ['IMP', 'EXP', 'Inland'],
    applicableShippingLines: [],
    autoTrigger: false,
    autoTriggerCondition: 'Manually triggered by dispatcher after driver reports delay',
    billToCustomer: true,
    payToSubcontractor: true,
    subcontractorAmount: 600,
    regionId: 'IN',
    isActive: true,
    createdAt: '2026-06-10T00:00:00Z'
  },
  {
    id: 'surch-cong',
    code: 'CONG',
    name: 'Port Congestion Fee',
    category: 'Port Fee',
    calculationMethod: 'Flat',
    amount: 2500,
    currency: 'INR',
    freePeriod: 0,
    freePeriodUnit: 'None',
    maxChargeCap: null,
    applicableScenarios: ['IMP', 'EXP'],
    applicableShippingLines: [],
    autoTrigger: false,
    autoTriggerCondition: 'Applied when port gate queue exceeds 4 hours',
    billToCustomer: true,
    payToSubcontractor: false,
    subcontractorAmount: 0,
    regionId: 'IN',
    isActive: true,
    createdAt: '2026-06-10T00:00:00Z'
  },
  {
    id: 'surch-chassis',
    code: 'CHASSIS',
    name: 'Chassis Holding Fee',
    category: 'Chassis',
    calculationMethod: 'Per Day',
    amount: 1500,
    currency: 'INR',
    freePeriod: 1,
    freePeriodUnit: 'Days',
    maxChargeCap: null,
    applicableScenarios: ['IMP', 'EXP', 'Inland'],
    applicableShippingLines: [],
    autoTrigger: false,
    autoTriggerCondition: 'Applied when chassis held at customer site beyond free day',
    billToCustomer: true,
    payToSubcontractor: false,
    subcontractorAmount: 0,
    regionId: 'IN',
    isActive: true,
    createdAt: '2026-06-10T00:00:00Z'
  }
];

export const BASE_TARIFFS: TariffRate[] = [
  // HZP-T1 (Port) to WH 1 (Zone D)
  { id: 'tf-1', regionId: 'IN', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone D (West Industrial)', size: '20GP', amount: 350 },
  { id: 'tf-2', regionId: 'IN', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone D (West Industrial)', size: '40GP', amount: 480 },
  { id: 'tf-3', regionId: 'IN', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone D (West Industrial)', size: '40HC', amount: 520 },
  
  // HZP-T1 (Port) to Zenith Plant (Zone E)
  { id: 'tf-4', regionId: 'IN', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone E (East Corridor)', size: '20GP', amount: 420 },
  { id: 'tf-5', regionId: 'IN', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone E (East Corridor)', size: '40GP', amount: 590 },
  { id: 'tf-6', regionId: 'IN', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone E (East Corridor)', size: '40HC', amount: 650 },

  // Apex Empty Central (Zone B) to Wharf/Custs
  { id: 'tf-7', regionId: 'IN', scenario: 'EXP', fromZone: 'Zone B (Inland East)', toZone: 'Zone E (East Corridor)', size: '20GP', amount: 280 },
  { id: 'tf-8', regionId: 'IN', scenario: 'EXP', fromZone: 'Zone B (Inland East)', toZone: 'Zone E (East Corridor)', size: '40GP', amount: 400 },
  { id: 'tf-9', regionId: 'IN', scenario: 'EXP', fromZone: 'Zone B (Inland East)', toZone: 'Zone E (East Corridor)', size: '40HC', amount: 440 },

  // Inland point-to-point (Zone D to Zone E)
  { id: 'tf-10', regionId: 'IN', scenario: 'Inland', fromZone: 'Zone D (West Industrial)', toZone: 'Zone E (East Corridor)', size: '40HC', amount: 600 },
  // EMTY Repositioning
  { id: 'tf-11', regionId: 'IN', scenario: 'EMTY', fromZone: 'Zone B (Inland East)', toZone: 'Zone C (North Coast)', size: '40GP', amount: 180 },
  // Return to ocean carrier (Zone D to Depot 1)
  { id: 'tf-12', regionId: 'IN', scenario: 'RETURN', fromZone: 'Zone D (West Industrial)', toZone: 'Zone B (Inland East)', size: '40HC', amount: 220 }
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-1',
    quoteNo: "QT-IN-2026-0001",
    regionId: "IN",
    customerId: "cust-1",
    scenario: "IMP",
    status: "confirmed",
    validFrom: "2026-05-12", // 30 days ago approx (ignoring exact date relative to today 2026-06-11)
    validTo: "2026-08-11", // 60 days from now
    rateItems: [
      {
        id: 'ri-1',
        containerType: "40HC",
        containerTypeId: "ct-40hc",
        originZoneId: "zone-a",
        destinationZoneId: "zone-d",
        baseRate: 45000,
        currency: "INR",
        returnLegRate: 8000,
        estimatedFuelSurcharge: 5400, // 12% of 45000
        applicableSurcharges: [
          { surchargeCode: "FAF", surchargeName: "Fuel Adjustment Factor", amount: 12, calculationMethod: "Percentage of Base", isIncluded: false },
          { surchargeCode: "DET", surchargeName: "Detention Charge", amount: 5000, calculationMethod: "Per Day", isIncluded: false },
          { surchargeCode: "WAIT", surchargeName: "Waiting Time", amount: 1000, calculationMethod: "Per Hour", isIncluded: false },
        ],
        totalEstimatedValue: 50400, // base + faf (Wait/Det are conditional/extra)
        rotRequired: true,
        notes: "Standard 40HC IMP rate"
      }
    ],
    totalValue: 50400,
    currency: "INR",
    internalNotes: "Confirmed contract",
    customerNotes: "Samsung India Import",
    createdBy: "user-admin",
    createdAt: "2026-05-12T00:00:00Z",
    updatedAt: "2026-05-12T00:00:00Z"
  },
  {
    id: 'quote-2',
    quoteNo: "QT-IN-2026-0002",
    regionId: "IN",
    customerId: "cust-2",
    scenario: "EXP",
    status: "confirmed",
    validFrom: "2026-05-12",
    validTo: "2026-08-11",
    rateItems: [
      {
        id: 'ri-2',
        containerType: "40GP",
        containerTypeId: "ct-40gp",
        originZoneId: "zone-b",
        destinationZoneId: "zone-a",
        baseRate: 38000,
        currency: "INR",
        returnLegRate: 0,
        estimatedFuelSurcharge: 4560, // 12%
        applicableSurcharges: [],
        totalEstimatedValue: 42560,
        rotRequired: true,
        notes: "Export rate"
      }
    ],
    totalValue: 42560,
    currency: "INR",
    internalNotes: "",
    customerNotes: "Atlas Exports",
    createdBy: "user-admin",
    createdAt: "2026-05-12T00:00:00Z",
    updatedAt: "2026-05-12T00:00:00Z"
  },
  {
    id: 'quote-3',
    quoteNo: "QT-IN-2026-0003",
    regionId: "IN",
    customerId: "cust-3",
    scenario: "Inland",
    status: "draft",
    validFrom: "2026-06-01",
    validTo: "2026-09-01",
    rateItems: [
      {
        id: 'ri-3',
        containerType: "20GP",
        containerTypeId: "ct-20gp",
        originZoneId: "zone-c",
        destinationZoneId: "zone-d",
        baseRate: 22000,
        currency: "INR",
        returnLegRate: 0,
        estimatedFuelSurcharge: 2640,
        applicableSurcharges: [],
        totalEstimatedValue: 24640,
        rotRequired: false,
        notes: "Inland draft"
      }
    ],
    totalValue: 24640,
    currency: "INR",
    internalNotes: "",
    customerNotes: "Inland Logistics Co",
    createdBy: "user-admin",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z"
  }
];

export const createMilestonesForScenario = (scenario: ScenarioType): MilestoneStep[] => {
  switch (scenario) {
    case 'IMP':
      return [
        { id: 'm-imp-0', label: 'Depot Empty Chassis Check', description: 'Inspect prime mover locking pins and pneumatic systems at container yard.', completed: true, timestamp: '2026-05-25T08:00:00Z', requiresEvidence: false },
        { id: 'm-imp-1', label: 'Terminal Gate-In', description: 'Present confirmed ROT gatepass at Horizon Port Terminal 1 Gate.', completed: false, requiresEvidence: false },
        { id: 'm-imp-2', label: 'Container Loaded', description: 'Secure laden importing container onto skeletal chassis. Lock pins and record seal number.', completed: false, requiresEvidence: true },
        { id: 'm-imp-3', label: 'Terminal Gate-Out', description: 'Acquire customs weight-bridge pass and leave port terminal gate.', completed: false, requiresEvidence: false },
        { id: 'm-imp-4', label: 'Arrive Customer Site', description: 'Deliver container at customer dock. Anchor chassis and present Consignment Note for opening inspect.', completed: false, requiresEvidence: false },
        { id: 'm-imp-5', label: 'Container Unstuffed', description: 'Unstuff furniture. Driver inspects container inner shell to verify clean sweep.', completed: false, requiresEvidence: true },
        { id: 'm-imp-6', label: 'Empty Container Return Depot', description: 'Deliver empty steel container to Apex Empty Depot yard stacks.', completed: false, requiresEvidence: true },
        { id: 'm-imp-7', label: 'POD Secured', description: 'Submit digitally coordinates and get customer gate exchange signing.', completed: false, requiresEvidence: true }
      ];
    case 'EXP':
      return [
        { id: 'm-exp-0', label: 'Depot Empty Pick', description: 'Claim ocean carrier empty container from Depot stack yard. Verify structural soundness.', completed: true, timestamp: '2026-05-25T07:30:00Z', requiresEvidence: true },
        { id: 'm-exp-1', label: 'Depot Gate-Out', description: 'Record dispatch exit time and match lock check.', completed: false, requiresEvidence: false },
        { id: 'm-exp-2', label: 'Arrive Customer Site', description: 'Navigate empty body to customer plant bay for export stuffing loading.', completed: false, requiresEvidence: false },
        { id: 'm-exp-3', label: 'Container Stuffed & Sealed', description: 'Verify safe loading. Lock legal custom steel bullet bolt seal. Photo record.', completed: false, requiresEvidence: true },
        { id: 'm-exp-4', label: 'Depart Customer Site', description: 'Enroute carrying custom-sealed loaded container to Export Terminal Gate.', completed: false, requiresEvidence: false },
        { id: 'm-exp-5', label: 'Terminal Gate-In', description: 'Hand over loaded container to Horizon Terminal 2 stacks.', completed: false, requiresEvidence: true },
        { id: 'm-exp-6', label: 'Export Complete', description: 'Terminal gate pass receipt approved and uploaded to portal.', completed: false, requiresEvidence: false }
      ];
    case 'Inland':
      return [
        { id: 'm-inl-0', label: 'Arrive Pickup Warehouse', description: 'Arrive at customer pickup origin plant.', completed: false, requiresEvidence: false },
        { id: 'm-inl-1', label: 'Secure Container', description: 'Match container IDs to document and secure locks.', completed: false, requiresEvidence: true },
        { id: 'm-inl-2', label: 'Gate-Out Transit', description: 'Depart origin point, en-route to dropoff depot.', completed: false, requiresEvidence: false },
        { id: 'm-inl-3', label: 'Arrive Destination site', description: 'Safely position the loaded box to receiver warehouse door.', completed: false, requiresEvidence: false },
        { id: 'm-inl-4', label: 'Deliver and Unlatch', description: 'Dismount or unpack. Secure receiver e-POD signature.', completed: false, requiresEvidence: true }
      ];
    case 'EMTY':
      return [
        { id: 'm-emt-0', label: 'Collect Empty Container', description: 'Pick up excess container from originating yard.', completed: false, requiresEvidence: false },
        { id: 'm-emt-1', label: 'Repositioning Transit', description: 'Laden empty body to target port or region stack yards.', completed: false, requiresEvidence: false },
        { id: 'm-emt-2', label: 'Gate-In Destination Depot', description: 'Submit return pass to depot stack officer.', completed: false, requiresEvidence: true },
        { id: 'm-emt-3', label: 'Reposition Complete', description: 'Interchange clearance card acquired.', completed: false, requiresEvidence: false }
      ];
    case 'RETURN':
      return [
        { id: 'm-ret-0', label: 'Acquire Custody Container', description: 'Pick up empty container held at yard.', completed: false, requiresEvidence: false },
        { id: 'm-ret-1', label: 'Direct Return Transit', description: 'Direct run to shipping line return depot.', completed: false, requiresEvidence: false },
        { id: 'm-ret-2', label: 'Verify Quality Control Check', description: 'Terminal operator inspects container body for panels or lock damage.', completed: false, requiresEvidence: true },
        { id: 'm-ret-3', label: 'Return Completed', description: 'EIR pass certified, container accounts cleared.', completed: false, requiresEvidence: false }
      ];
    default:
      return [];
  }
};

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    regionId: 'IN',
    jobNo: 'JB-2026-1001',
    tenantId: 'tenant-1',
    customerId: 'cust-1',
    quotationId: 'quote-1',
    rateItemId: 'qr-1',
    scenario: 'IMP',
    containerNo: 'MSCU1234567',
    sealNo: 'SL-99210',
    containerSize: '40HC',
    weightKg: 24500,
    shippingLine: 'MSC Mediterranean',
    vesselName: 'MSC Isabella',
    voyageNo: 'V-2410W',
    eta: '2026-05-24',
    originLocationId: 'loc-port-1',
    destinationLocationId: 'loc-cust-1',
    emptyReturnLocationId: 'loc-depot-1',
    status: 'active',
    driverId: 'drv-1', // Assigned to Bob Johnson
    vehicleId: 'veh-1',
    scheduledTime: '2026-05-25 08:00',
    milestones: createMilestonesForScenario('IMP'),
    currentMilestoneIndex: 1, // Currently at Terminal Gate-In
    hasDynamicInsertion: false,
    extraSurchargesIncurred: [],
    gateOutTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    freeTimeDays: 7,
    freeTimeExpiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2026-05-20T08:00:00.000Z'
  },
  {
    id: 'job-2',
    regionId: 'IN',
    jobNo: 'JB-2026-1002',
    tenantId: 'tenant-1',
    customerId: 'cust-2',
    quotationId: 'quote-2',
    rateItemId: 'qr-3',
    scenario: 'EXP',
    containerNo: 'CMAU8837125',
    sealNo: 'SL-1234F',
    containerSize: '40GP',
    weightKg: 19100,
    shippingLine: 'CMA CGM',
    vesselName: 'CMA CGM Antoine',
    voyageNo: 'V-881E',
    eta: '2026-05-28',
    originLocationId: 'loc-depot-1',
    destinationLocationId: 'loc-cust-2',
    emptyPickupLocationId: 'loc-depot-1',
    status: 'scheduled',
    driverId: 'drv-2', // Alice Smith
    vehicleId: 'veh-2',
    scheduledTime: '2026-05-25 13:30',
    milestones: createMilestonesForScenario('EXP'),
    currentMilestoneIndex: 0,
    hasDynamicInsertion: false,
    extraSurchargesIncurred: [],
    gateOutTimestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    freeTimeDays: 7,
    freeTimeExpiry: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    detentionLiability: "customer",
    detentionChargeAmount: 5000,
    createdAt: '2026-05-18T09:30:00.000Z'
  },
  {
    id: 'job-3',
    regionId: 'IN',
    jobNo: 'JB-2026-1003',
    tenantId: 'tenant-1',
    customerId: 'cust-1',
    quotationId: 'quote-1',
    rateItemId: 'qr-2',
    scenario: 'RETURN',
    containerNo: 'HDMU7721839',
    sealNo: 'SL-44111',
    containerSize: '40HC',
    weightKg: 4200,
    shippingLine: 'HMM Lines',
    vesselName: 'HMM Algeciras',
    voyageNo: 'V-201S',
    eta: '2026-05-29',
    originLocationId: 'loc-cust-1',
    destinationLocationId: 'loc-depot-1',
    status: 'pending',
    milestones: createMilestonesForScenario('RETURN'),
    currentMilestoneIndex: 0,
    hasDynamicInsertion: false,
    extraSurchargesIncurred: [],
    gateOutTimestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    gateInTimestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    freeTimeDays: 7,
    freeTimeExpiry: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    detentionLiability: null,
    detentionChargeAmount: 0,
    createdAt: '2026-05-16T10:00:00.000Z'
  },
  {
    id: 'job-4',
    regionId: 'IN',
    jobNo: 'JB-2026-1004',
    tenantId: 'tenant-1',
    customerId: 'cust-2',
    quotationId: 'quote-2',
    rateItemId: 'qr-3',
    scenario: 'EXP',
    containerNo: 'OOLU5519233',
    sealNo: 'SL-77823',
    containerSize: '20GP',
    weightKg: 18500,
    shippingLine: 'OOCL',
    vesselName: 'OOCL Hong Kong',
    voyageNo: 'V-117N',
    eta: '2026-06-02',
    originLocationId: 'loc-depot-1',
    destinationLocationId: 'loc-cust-2',
    emptyPickupLocationId: 'loc-depot-1',
    status: 'active',
    milestones: createMilestonesForScenario('EXP'),
    currentMilestoneIndex: 2,
    hasDynamicInsertion: false,
    extraSurchargesIncurred: [],
    gateOutTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    freeTimeDays: 5,
    freeTimeExpiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    detentionLiability: 'disputed',
    detentionChargeAmount: 10000,
    detentionNotes: 'Driver arrived at port gate before expiry but port queue delayed gate-in by 3 hours. Dispute raised with OOCL.',
    createdAt: '2026-06-08T07:00:00.000Z'
  }
];

export const INITIAL_ROTS: ROT[] = [
  { id: 'rot-1', regionId: 'IN', jobId: 'job-1', rotNo: 'ROT-992110', status: 'confirmed', gateReleaseCode: 'REL-MSC-84192', depotExpiry: '2026-05-30', verifiedBy: 'Office Dispatch Admin' },
  { id: 'rot-2', regionId: 'IN', jobId: 'job-2', rotNo: 'ROT-554109', status: 'draft', gateReleaseCode: 'REL-CMA-22180', depotExpiry: '2026-06-02' }
];

export const INITIAL_CONS_NOTES: ConsignmentNote[] = [
  { id: 'cn-1', regionId: 'IN', jobId: 'job-1', cnNo: 'CN-2026-88001', status: 'issued', printed: true },
  { id: 'cn-2', regionId: 'IN', jobId: 'job-2', cnNo: 'CN-2026-88002', status: 'draft', printed: false }
];

export const DEFAULT_ZONES: Zone[] = [
  { id: 'zone-a', regionId: 'IN', name: 'Zone A (Port Gates)', code: 'ZN-PRT-A', type: 'Port Sector', description: 'Horizon terminal docks and customs bypass precinct.' },
  { id: 'zone-b', regionId: 'IN', name: 'Zone B (Inland East)', code: 'ZN-INL-B', type: 'Inland Corridor', description: 'Depot dry-stacks and eastern transfer terminals.' },
  { id: 'zone-c', regionId: 'IN', name: 'Zone C (North Coast)', code: 'ZN-NTH-C', type: 'Industrial Hub', description: 'Northern seaside chemical and heavy engineering complexes.' },
  { id: 'zone-d', regionId: 'IN', name: 'Zone D (West Industrial)', code: 'ZN-WST-D', type: 'Industrial Hub', description: 'Western dry cargo warehouses and furniture plants.' }
];

export const DEFAULT_ZONE_TYPES: ZoneType[] = [
  { id: 'zt-1', name: 'Port Sector', description: 'Terminal gate docks under strict customs control.' },
  { id: 'zt-2', name: 'Inland Corridor', description: 'Expressway routes mapping inland dry stack transfer depots.' },
  { id: 'zt-3', name: 'Industrial Hub', description: 'Factories, stuffing plants, and consumer distribution parks.' }
];

export const INITIAL_USERS: User[] = [
  { 
    id: 'user-admin', 
    name: 'Office Administrator', 
    email: 'admin@atlas.com', 
    role: 'administrator', 
    isActive: true,
    regionId: null,
    regionAccess: ["ALL"],
    userLevel: "corporate_admin",
    passwordHash: 'admin123', // MOCK — plain text for demo
    status: 'active',
    mustChangePassword: false
  },
  { 
    id: 'user-dispatch', 
    name: 'Dispatch Board Coordinator', 
    email: 'dispatch@atlas-haulage.com', 
    role: 'dispatcher', 
    isActive: true,
    regionId: 'IN',
    regionAccess: ['IN'],
    userLevel: "region_user",
    passwordHash: 'demo123', // MOCK
    status: 'active'
  },
  { 
    id: 'user-billing', 
    name: 'Billing Specialist', 
    email: 'billing@atlas-haulage.com', 
    role: 'billing', 
    isActive: true,
    regionId: 'UAE',
    regionAccess: ['UAE'],
    userLevel: "region_user",
    passwordHash: 'demo123', // MOCK
    status: 'active'
  },
  { 
    id: 'user-driver', 
    name: 'Bob Johnson', 
    email: 'driver@atlas-haulage.com', 
    role: 'driver_emulator', 
    isActive: true,
    regionId: 'IN',
    regionAccess: ['IN'],
    userLevel: "region_user",
    passwordHash: 'demo123', // MOCK
    status: 'active'
  }
];

export const INITIAL_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.atlas-haulage.com',
  port: 587,
  username: 'relay@atlas-haulage.com',
  senderEmail: 'notifications@atlas-haulage.com',
  encryption: 'tls',
  active: true
};

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  { 
    id: 'tpl-booked', 
    name: 'Container Job Receipt', 
    triggerEvent: 'Job Booked', 
    subject: 'JOB CONFIRMED: {{jobNo}} Booked Successfully', 
    body: 'Dear Customer,\n\nWe have successfully received and scheduled Container Job Number {{jobNo}}.\n\nContainer Reference: {{containerNo}}\nOperations Scenario: {{scenario}}\nScheduled Pickup: {{scheduledTime}}\n\nThank you for choosing Atlas Container Lines.\nBest Regards,\nOperations Dispatch Control',
    variables: ['jobNo', 'customerName', 'containerNo', 'scenario', 'scheduledTime']
  },
  { 
    id: 'tpl-milestone', 
    name: 'Terminal Milestone Alert', 
    triggerEvent: 'Milestone Completed', 
    subject: 'TRANSIT UPDATE: Milestone Complete for Job {{jobNo}}', 
    body: 'Cargo Tracker System,\n\nContainer {{containerNo}} associated with Job {{jobNo}} has achieved the following status milestone checkpoint:\n\nActive Status: {{milestoneName}}\nTimestamp Checked: {{completionTime}}\n\nOur ground haulier is enroute safely to the next destination point.\n\nRegards,\nSaaS Logistics Server',
    variables: ['jobNo', 'containerNo', 'milestoneName', 'completionTime']
  },
  { 
    id: 'tpl-invoice', 
    name: 'Settle Invoice Issue', 
    triggerEvent: 'Invoice Issued', 
    subject: 'CHARGES PENDING: Invoice {{invoiceNo}} Generated', 
    body: 'Finance Ledger Account Service,\n\nWe have dispatched invoice Number {{invoiceNo}} in relation to dispatch job {{jobNo}}.\n\nSubTotal Amount: ${{subTotal}}\nTax Surcharges: ${{taxAmount}}\nTotal Outstanding Remittance Due: ${{totalAmount}}\n\nPlease remit balances matching Net payment terms.\n\nRegards,\nFinance Billing Department',
    variables: ['invoiceNo', 'jobNo', 'totalAmount', 'subTotal', 'taxAmount']
  }
];

export const INITIAL_SHIPPING_LINES: ShippingLine[] = [
  {
    id: 'ship-maersk',
    name: 'Maersk Line',
    scacCode: 'MAEU',
    shortCode: 'Maersk',
    logoColor: '#2563EB', // Blue
    freeTimeDays: 7,
    detentionRatePerDay: 5000,
    currency: 'INR',
    regionId: 'IN',
    isActive: true
  },
  {
    id: 'ship-msc',
    name: 'Mediterranean Shipping Company',
    scacCode: 'MSCU',
    shortCode: 'MSC',
    logoColor: '#F59E0B', // Amber
    freeTimeDays: 7,
    detentionRatePerDay: 5000,
    currency: 'INR',
    regionId: 'IN',
    isActive: true
  },
  {
    id: 'ship-cma',
    name: 'CMA CGM',
    scacCode: 'CMDU',
    shortCode: 'CMA CGM',
    logoColor: '#10B981', // Emerald
    freeTimeDays: 7,
    detentionRatePerDay: 5000,
    currency: 'INR',
    regionId: 'IN',
    isActive: true
  },
  {
    id: 'ship-evergreen',
    name: 'Evergreen Marine Corporation',
    scacCode: 'EISU',
    shortCode: 'Evergreen',
    logoColor: '#059669', // Dark Emerald
    freeTimeDays: 7,
    detentionRatePerDay: 5000,
    currency: 'INR',
    regionId: 'IN',
    isActive: true
  }
];

export const INITIAL_VESSELS: Vessel[] = [
  {
    id: 'vess-1',
    vesselName: 'Maersk Eindhoven',
    imoNumber: '9778534',
    shippingLineId: 'ship-maersk',
    flag: 'Panama',
    vesselType: 'Container Ship',
    isActive: true
  },
  {
    id: 'vess-2',
    vesselName: 'MSC Oscar',
    imoNumber: '9703318',
    shippingLineId: 'ship-msc',
    flag: 'Panama',
    vesselType: 'Container Ship',
    isActive: true
  },
  {
    id: 'vess-3',
    vesselName: 'CMA CGM Antoine de Saint Exupery',
    imoNumber: '9776418',
    shippingLineId: 'ship-cma',
    flag: 'France',
    vesselType: 'Container Ship',
    isActive: true
  },
  {
    id: 'vess-4',
    vesselName: 'Ever Given',
    imoNumber: '9811000',
    shippingLineId: 'ship-evergreen',
    flag: 'Panama',
    vesselType: 'Container Ship',
    isActive: true
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vend-1',
    vendorName: 'Indo-Haulage Subcontractors',
    vendorCode: 'IHS-IN-01',
    contactPerson: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'ops@indohaulage.co.in',
    address: 'Plot 42, Port Access Road, Chennai',
    regionId: 'IN',
    taxId: '33AAAAA1111A1Z1',
    paymentTerms: 'Net 30',
    specialization: 'Haulage',
    isActive: true
  },
  {
    id: 'vend-2',
    vendorName: 'Gateway Customs & Freight Services',
    vendorCode: 'GCF-IN-02',
    contactPerson: 'Meera Nair',
    phone: '+91 99887 76655',
    email: 'info@gatewaycustoms.com',
    address: 'Regus Palace, Marine Lines, Mumbai',
    regionId: 'IN',
    taxId: '27BBBBB2222B2Z2',
    paymentTerms: 'Net 15',
    specialization: 'Customs',
    isActive: true
  },
  {
    id: 'vend-3',
    vendorName: 'All-In-One Logistics Solutions',
    vendorCode: 'AOL-IN-03',
    contactPerson: 'Vikram Singh',
    phone: '+91 91234 56789',
    email: 'partner@alloneops.com',
    address: 'Sardar Patel Ring Road, Ahmedabad',
    regionId: 'IN',
    taxId: '24CCCCC3333C3Z3',
    paymentTerms: 'Net 45',
    specialization: 'Both',
    isActive: true
  }
];

export const INITIAL_CONTAINER_TYPES: ContainerType[] = [
  {
    id: 'ct-20gp',
    code: '20GP',
    name: '20ft General Purpose',
    isoCode: '22G1',
    lengthFt: 20,
    heightFt: 8.5,
    tareWeightKg: 2200,
    maxPayloadKg: 28200,
    category: 'Dry',
    isActive: true
  },
  {
    id: 'ct-40gp',
    code: '40GP',
    name: '40ft General Purpose',
    isoCode: '42G1',
    lengthFt: 40,
    heightFt: 8.5,
    tareWeightKg: 3750,
    maxPayloadKg: 28750,
    category: 'Dry',
    isActive: true
  },
  {
    id: 'ct-40hc',
    code: '40HC',
    name: '40ft High Cube',
    isoCode: '45G1',
    lengthFt: 40,
    heightFt: 9.5,
    tareWeightKg: 3900,
    maxPayloadKg: 28600,
    category: 'Dry',
    isActive: true
  },
  {
    id: 'ct-20rf',
    code: '20RF',
    name: '20ft Reefer (Refrigerated)',
    isoCode: '22R1',
    lengthFt: 20,
    heightFt: 8.5,
    tareWeightKg: 3200,
    maxPayloadKg: 27280,
    category: 'Reefer',
    isActive: true
  },
  {
    id: 'ct-40rf',
    code: '40RF',
    name: '40ft Reefer (Refrigerated)',
    isoCode: '45R1',
    lengthFt: 40,
    heightFt: 9.5,
    tareWeightKg: 4800,
    maxPayloadKg: 27700,
    category: 'Reefer',
    isActive: true
  },
  {
    id: 'ct-45hc',
    code: '45HC',
    name: '45ft High Cube',
    isoCode: 'EG10',
    lengthFt: 45,
    heightFt: 9.5,
    tareWeightKg: 4850,
    maxPayloadKg: 27850,
    category: 'Dry',
    isActive: true
  }
];

export const INITIAL_INVOICE_SETTINGS: InvoiceSettings[] = [
  {
    id: 'is-in',
    regionId: 'IN',
    invoicePrefix: 'INV-IN',
    currentSequence: 1,
    defaultPaymentTerms: 'Net 30',
    defaultDueDays: 30,
    taxLabel: 'GST',
    taxRate: 18,
    showTaxBreakdown: true,
    footerNote: "Thank you for your business. Payment due within 30 days.",
    bankName: "HDFC Bank",
    bankAccountNo: "XXXX-XXXX-1234",
    bankSwiftCode: "HDFCINBB",
    autoCreateOnJobClose: true,
    requireApprovalBeforeSend: true
  },
  {
    id: 'is-ae',
    regionId: 'AE',
    invoicePrefix: 'INV-AE',
    currentSequence: 1,
    defaultPaymentTerms: 'Net 15',
    defaultDueDays: 15,
    taxLabel: 'VAT',
    taxRate: 5,
    showTaxBreakdown: true,
    footerNote: "شكراً لتعاملكم معنا",
    bankName: "Emirates NBD",
    bankAccountNo: "AE070331234567890123456",
    bankSwiftCode: "EBILAEAD",
    autoCreateOnJobClose: false,
    requireApprovalBeforeSend: true
  }
];

export const INITIAL_SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { id: "lang-en", code: "en", name: "English", nativeName: "English", isRTL: false, isActive: true },
  { id: "lang-ta", code: "ta", name: "Tamil", nativeName: "தமிழ்", isRTL: false, isActive: true },
  { id: "lang-ar", code: "ar", name: "Arabic", nativeName: "العربية", isRTL: true, isActive: true },
  { id: "lang-ms", code: "ms", name: "Bahasa Melayu", nativeName: "Bahasa", isRTL: false, isActive: true },
  { id: "lang-fr", code: "fr", name: "French", nativeName: "Français", isRTL: false, isActive: false },
  { id: "lang-hi", code: "hi", name: "Hindi", nativeName: "हिंदी", isRTL: false, isActive: false },
];

export const INITIAL_TRANSLATIONS: TranslationEntry[] = [
  // Tamil CN document field translations
  { id: "tr-ta-cn-shipper", languageCode: "ta", category: "document_field", key: "shipper", englishValue: "Shipper Details", translatedValue: "ஏற்றுமதியாளர்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-consignee", languageCode: "ta", category: "document_field", key: "consignee", englishValue: "Consignee Details", translatedValue: "பெறுநர்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-containerno", languageCode: "ta", category: "document_field", key: "container_no", englishValue: "Container No", translatedValue: "கண்டெய்னர் எண்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-sealno", languageCode: "ta", category: "document_field", key: "seal_no", englishValue: "Seal No", translatedValue: "சீல் எண்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-grossweight", languageCode: "ta", category: "document_field", key: "gross_weight", englishValue: "Gross Weight", translatedValue: "மொத்த எடை", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-description", languageCode: "ta", category: "document_field", key: "description", englishValue: "Description of Goods", translatedValue: "பொருள் விவரம்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-drivername", languageCode: "ta", category: "document_field", key: "driver_name", englishValue: "Driver Name", translatedValue: "ஓட்டுனர் பெயர்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-vehicleno", languageCode: "ta", category: "document_field", key: "vehicle_no", englishValue: "Vehicle No", translatedValue: "வாகன எண்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-dateofissue", languageCode: "ta", category: "document_field", key: "date_of_issue", englishValue: "Date of Issue", translatedValue: "வெளியீட்டு தேதி", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-placeofloading", languageCode: "ta", category: "document_field", key: "place_of_loading", englishValue: "Place of Loading", translatedValue: "ஏற்றும் இடம்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-placeofdelivery", languageCode: "ta", category: "document_field", key: "place_of_delivery", englishValue: "Place of Delivery", translatedValue: "டெலிவரி இடம்", documentType: "CN", isVerified: true },
  { id: "tr-ta-cn-signature", languageCode: "ta", category: "document_field", key: "signature", englishValue: "Signature", translatedValue: "கையொப்பம்", documentType: "CN", isVerified: true },

  // Tamil status labels
  { id: "tr-ta-st-active", languageCode: "ta", category: "status_label", key: "active", englishValue: "active", translatedValue: "செயலில்", documentType: "ALL", isVerified: true },
  { id: "tr-ta-st-completed", languageCode: "ta", category: "status_label", key: "completed", englishValue: "completed", translatedValue: "நிறைவடைந்தது", documentType: "ALL", isVerified: true },
  { id: "tr-ta-st-pending", languageCode: "ta", category: "status_label", key: "pending", englishValue: "pending", translatedValue: "நிலுவையில்", documentType: "ALL", isVerified: true },
  { id: "tr-ta-st-cancelled", languageCode: "ta", category: "status_label", key: "cancelled", englishValue: "cancelled", translatedValue: "ரத்து செய்யப்பட்டது", documentType: "ALL", isVerified: true },

  // Arabic CN document field translations
  { id: "tr-ar-cn-shipper", languageCode: "ar", category: "document_field", key: "shipper", englishValue: "Shipper Details", translatedValue: "الشاحن", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-consignee", languageCode: "ar", category: "document_field", key: "consignee", englishValue: "Consignee Details", translatedValue: "المرسل إليه", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-containerno", languageCode: "ar", category: "document_field", key: "container_no", englishValue: "Container No", translatedValue: "رقم الحاوية", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-sealno", languageCode: "ar", category: "document_field", key: "seal_no", englishValue: "Seal No", translatedValue: "رقم الختم", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-grossweight", languageCode: "ar", category: "document_field", key: "gross_weight", englishValue: "Gross Weight", translatedValue: "الوزن الإجمالي", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-description", languageCode: "ar", category: "document_field", key: "description", englishValue: "Description of Goods", translatedValue: "وصف البضاعة", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-drivername", languageCode: "ar", category: "document_field", key: "driver_name", englishValue: "Driver Name", translatedValue: "اسم السائق", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-vehicleno", languageCode: "ar", category: "document_field", key: "vehicle_no", englishValue: "Vehicle No", translatedValue: "رقم المركبة", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-dateofissue", languageCode: "ar", category: "document_field", key: "date_of_issue", englishValue: "Date of Issue", translatedValue: "تاريخ الإصدار", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-placeofloading", languageCode: "ar", category: "document_field", key: "place_of_loading", englishValue: "Place of Loading", translatedValue: "مكان التحميل", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-placeofdelivery", languageCode: "ar", category: "document_field", key: "place_of_delivery", englishValue: "Place of Delivery", translatedValue: "مكان التسليم", documentType: "CN", isVerified: true },
  { id: "tr-ar-cn-signature", languageCode: "ar", category: "document_field", key: "signature", englishValue: "Signature", translatedValue: "التوقيع", documentType: "CN", isVerified: true },
];

export const INITIAL_CUSTOMER_PAYMENTS: CustomerPayment[] = [
  {
    id: 'cp-001',
    receiptNo: 'RCP-IN-2026-0001',
    regionId: 'IN',
    customerId: 'cust-4',
    invoiceIds: ['inv-in-001'],
    allocations: [
      { invoiceId: 'inv-in-001', invoiceNo: 'INV-IN-2026-0001', allocatedAmount: 47000 }
    ],
    totalAmount: 47000,
    currency: 'INR',
    paymentDate: '2026-06-05',
    paymentMethod: 'bank_transfer',
    referenceNo: 'HDFC/20260605/447821',
    status: 'allocated',
    notes: 'Full settlement of June invoice',
    createdBy: 'usr-billing-in',
    createdAt: '2026-06-05T10:30:00Z',
  },
  {
    id: 'cp-002',
    receiptNo: 'RCP-IN-2026-0002',
    regionId: 'IN',
    customerId: 'cust-5',
    invoiceIds: ['inv-in-002'],
    allocations: [
      { invoiceId: 'inv-in-002', invoiceNo: 'INV-IN-2026-0002', allocatedAmount: 25000 }
    ],
    totalAmount: 25000,
    currency: 'INR',
    paymentDate: '2026-06-10',
    paymentMethod: 'cheque',
    referenceNo: 'CHQ-007842',
    status: 'partial',
    notes: 'Partial payment; balance ₹20,000 to follow',
    createdBy: 'usr-billing-in',
    createdAt: '2026-06-10T14:15:00Z',
  },
  {
    id: 'cp-003',
    receiptNo: 'RCP-IN-2026-0003',
    regionId: 'IN',
    customerId: 'cust-1',
    invoiceIds: [],
    allocations: [],
    totalAmount: 38000,
    currency: 'INR',
    paymentDate: '2026-06-12',
    paymentMethod: 'bank_transfer',
    referenceNo: 'ICICI/20260612/993004',
    status: 'unallocated',
    notes: 'Payment received — awaiting invoice matching',
    createdBy: 'usr-billing-in',
    createdAt: '2026-06-12T09:00:00Z',
  },
];

export const INITIAL_VENDOR_PAYMENTS: VendorPayment[] = [
  {
    id: 'vp-001',
    adviceNo: 'PA-IN-2026-0001',
    regionId: 'IN',
    vendorId: 'vend-1',
    tripIds: ['JOB-IN-2026-0001', 'JOB-IN-2026-0002', 'JOB-IN-2026-0003'],
    lineItems: [
      { tripId: 'JOB-IN-2026-0001', jobNo: 'JOB-IN-2026-0001', description: 'IMP laden leg — Chennai Port to Guindy', buyRate: 12000, surchargesBuy: 1500, totalPayable: 13500 },
      { tripId: 'JOB-IN-2026-0002', jobNo: 'JOB-IN-2026-0002', description: 'EXP laden leg — Coimbatore to Chennai Port', buyRate: 11000, surchargesBuy: 1000, totalPayable: 12000 },
      { tripId: 'JOB-IN-2026-0003', jobNo: 'JOB-IN-2026-0003', description: 'EMTY repositioning — Guindy to Chennai Depot', buyRate: 5500, surchargesBuy: 500, totalPayable: 6000 },
    ],
    subtotal: 31500,
    currency: 'INR',
    paymentDate: '2026-06-08',
    paymentMethod: 'bank_transfer',
    referenceNo: 'HDFC/20260608/VND-0091',
    status: 'paid',
    approvedBy: 'admin@atlas.com',
    approvedAt: '2026-06-07T09:00:00Z',
    paidAt: '2026-06-08T11:30:00Z',
    createdBy: 'admin@atlas.com',
    createdAt: '2026-06-06T16:00:00Z',
  },
  {
    id: 'vp-002',
    adviceNo: 'PA-IN-2026-0002',
    regionId: 'IN',
    vendorId: 'vend-2',
    tripIds: ['JOB-IN-2026-0004', 'JOB-IN-2026-0005'],
    lineItems: [
      { tripId: 'JOB-IN-2026-0004', jobNo: 'JOB-IN-2026-0004', description: 'Inland laden leg — Pune to JNPT', buyRate: 14000, surchargesBuy: 2000, totalPayable: 16000 },
      { tripId: 'JOB-IN-2026-0005', jobNo: 'JOB-IN-2026-0005', description: 'RETURN empty — JNPT to Pune Depot', buyRate: 6500, surchargesBuy: 500, totalPayable: 7000 },
    ],
    subtotal: 23000,
    currency: 'INR',
    status: 'pending',
    createdBy: 'admin@atlas.com',
    createdAt: '2026-06-13T10:00:00Z',
  },
];

