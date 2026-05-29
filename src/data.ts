/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, Customer, LocationGeo, Vehicle, Driver, SurchargeRule, TariffRate, Quotation, Job, MilestoneStep, ScenarioType, ROT, ConsignmentNote, Zone, ZoneType, User, SmtpConfig, EmailTemplate } from './types';

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
    baseTariffsEnabled: true
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
    baseTariffsEnabled: true
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
    baseTariffsEnabled: false
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Pacific Furniture Co.',
    taxId: 'TX-992182-A',
    address: '25 East industrial Boulevard, Zone 4',
    creditLimit: 50000,
    paymentTerms: 'Net 30',
    email: 'billing@pacificfurniture.com',
    phone: '+1 (555) 234-5678'
  },
  {
    id: 'cust-2',
    name: 'Zenith Electronics Ltd.',
    taxId: 'TX-105541-E',
    address: 'High Tech Park, West Section, Bldg 8',
    creditLimit: 75000,
    paymentTerms: 'Net 15',
    email: 'logistics@zenithelec.co',
    phone: '+1 (555) 876-5432'
  },
  {
    id: 'cust-3',
    name: 'Apex Agricultural Silos',
    taxId: 'TX-440239-X',
    address: 'Grain Docks Road, Wharf Sector B',
    creditLimit: 30000,
    paymentTerms: 'Net 45',
    email: 'import-team@apexagri.com',
    phone: '+1 (555) 345-6789'
  }
];

export const MOCK_LOCATIONS: LocationGeo[] = [
  {
    id: 'loc-port-1',
    name: 'Terminal 1, Horizon Port',
    code: 'HZP-T1',
    type: 'port',
    lat: 80,
    lng: 320,
    zone: 'Zone A (Port Area)',
    geofenceRadius: 500
  },
  {
    id: 'loc-port-2',
    name: 'Terminal 2, South Port Gate',
    code: 'HZP-T2',
    type: 'port',
    lat: 90,
    lng: 480,
    zone: 'Zone A (Port Area)',
    geofenceRadius: 500
  },
  {
    id: 'loc-depot-1',
    name: 'Apex Empty Container Pool',
    code: 'APX-DEP',
    type: 'depot',
    lat: 340,
    lng: 520,
    zone: 'Zone B (Inland East)',
    geofenceRadius: 300
  },
  {
    id: 'loc-depot-2',
    name: 'East Coast Empty Depot',
    code: 'ECE-DEP',
    type: 'depot',
    lat: 480,
    lng: 150,
    zone: 'Zone C (North Coast)',
    geofenceRadius: 300
  },
  {
    id: 'loc-cust-1',
    name: 'Pacific Furniture WH 1',
    code: 'PF-WH1',
    type: 'customer',
    lat: 280,
    lng: 160,
    zone: 'Zone D (West Industrial)',
    geofenceRadius: 200
  },
  {
    id: 'loc-cust-2',
    name: 'Zenith Electronics Main Plant',
    code: 'ZE-PLNT',
    type: 'customer',
    lat: 500,
    lng: 380,
    zone: 'Zone E (East Corridor)',
    geofenceRadius: 250
  },
  {
    id: 'loc-cust-3',
    name: 'Apex Agri Storage Hub',
    code: 'AA-HUB',
    type: 'customer',
    lat: 180,
    lng: 480,
    zone: 'Zone F (Southern Basin)',
    geofenceRadius: 400
  }
];

export const DEFAULT_VEHICLES: Vehicle[] = [
  { id: 'veh-1', plateNumber: 'PM-8821-X', type: 'skeletal', ownerType: 'in-house', roadTaxExpiry: '2026-11-20', maintenanceAlert: false },
  { id: 'veh-2', plateNumber: 'PM-5044-Y', type: 'flatbed', ownerType: 'in-house', roadTaxExpiry: '2026-08-14', maintenanceAlert: false },
  { id: 'veh-3', plateNumber: 'PM-1033-A', type: 'sideloader', ownerType: 'subcontract', roadTaxExpiry: '2027-02-10', maintenanceAlert: true },
  { id: 'veh-4', plateNumber: 'PM-4541-W', type: 'tipper', ownerType: 'in-house', roadTaxExpiry: '2026-10-05', maintenanceAlert: false },
  { id: 'veh-5', plateNumber: 'PM-3312-Z', type: 'skeletal', ownerType: 'subcontract', roadTaxExpiry: '2026-12-01', maintenanceAlert: false }
];

export const DEFAULT_DRIVERS: Driver[] = [
  { id: 'drv-1', name: 'Bob Johnson', licenseNumber: 'DL-992019A', licenseExpiry: '2028-04-12', portPassNumber: 'PP-882-X', phone: '+1 (555) 123-0101', assignedVehicleId: 'veh-1', currentStatus: 'idle' },
  { id: 'drv-2', name: 'Alice Smith', licenseNumber: 'DL-441029B', licenseExpiry: '2027-09-30', portPassNumber: 'PP-102-Y', phone: '+1 (555) 123-0202', assignedVehicleId: 'veh-2', currentStatus: 'idle' },
  { id: 'drv-3', name: 'Charles Lee', licenseNumber: 'DL-301142C', licenseExpiry: '2030-01-15', portPassNumber: 'PP-334-A', phone: '+1 (555) 123-0303', assignedVehicleId: 'veh-3', currentStatus: 'idle' },
  { id: 'drv-4', name: 'David Miller', licenseNumber: 'DL-770421D', licenseExpiry: '2026-06-18', portPassNumber: 'PP-454-W', phone: '+1 (555) 123-0404', assignedVehicleId: 'veh-4', currentStatus: 'idle' },
  { id: 'drv-5', name: 'Eliza Watson', licenseNumber: 'DL-229988E', licenseExpiry: '2029-11-25', portPassNumber: 'PP-901-Z', phone: '+1 (555) 123-0505', assignedVehicleId: 'veh-5', currentStatus: 'idle' }
];

export const SURCHARGE_CATALOG: SurchargeRule[] = [
  { code: 'FAF', name: 'Fuel Adjustment Factor (FAF)', amount: 45, unit: 'Flat % on Base Rate', autoTrigger: 'Always applicable' },
  { code: 'PORT_FEE', name: 'Port Terminal Lift-on Lift-off Gate Charge', amount: 80, unit: 'Per Gate Event', autoTrigger: 'IMP / EXP actions' },
  { code: 'DET_WARN', name: 'Container Late-Return Detention Penalty', amount: 120, unit: 'Per Day Exceeded', autoTrigger: 'Exceeding Free Time' },
  { code: 'CHAS_HOLD', name: 'Extended Chassis Idle Parking Surcharge', amount: 95, unit: 'Per Night Holdover', autoTrigger: 'Night overstay' },
  { code: 'WASH_FEE', name: 'Hazmat / Chemical Container Steam Wash', amount: 150, unit: 'Per Clean Event', autoTrigger: 'Chemical / Agri shipments' }
];

export const BASE_TARIFFS: TariffRate[] = [
  // HZP-T1 (Port) to WH 1 (Zone D)
  { id: 'tf-1', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone D (West Industrial)', size: '20GP', amount: 350 },
  { id: 'tf-2', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone D (West Industrial)', size: '40GP', amount: 480 },
  { id: 'tf-3', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone D (West Industrial)', size: '40HC', amount: 520 },
  
  // HZP-T1 (Port) to Zenith Plant (Zone E)
  { id: 'tf-4', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone E (East Corridor)', size: '20GP', amount: 420 },
  { id: 'tf-5', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone E (East Corridor)', size: '40GP', amount: 590 },
  { id: 'tf-6', scenario: 'IMP', fromZone: 'Zone A (Port Area)', toZone: 'Zone E (East Corridor)', size: '40HC', amount: 650 },

  // Apex Empty Central (Zone B) to Wharf/Custs
  { id: 'tf-7', scenario: 'EXP', fromZone: 'Zone B (Inland East)', toZone: 'Zone E (East Corridor)', size: '20GP', amount: 280 },
  { id: 'tf-8', scenario: 'EXP', fromZone: 'Zone B (Inland East)', toZone: 'Zone E (East Corridor)', size: '40GP', amount: 400 },
  { id: 'tf-9', scenario: 'EXP', fromZone: 'Zone B (Inland East)', toZone: 'Zone E (East Corridor)', size: '40HC', amount: 440 },

  // Inland point-to-point (Zone D to Zone E)
  { id: 'tf-10', scenario: 'Inland', fromZone: 'Zone D (West Industrial)', toZone: 'Zone E (East Corridor)', size: '40HC', amount: 600 },
  // EMTY Repositioning
  { id: 'tf-11', scenario: 'EMTY', fromZone: 'Zone B (Inland East)', toZone: 'Zone C (North Coast)', size: '40GP', amount: 180 },
  // Return to ocean carrier (Zone D to Depot 1)
  { id: 'tf-12', scenario: 'RETURN', fromZone: 'Zone D (West Industrial)', toZone: 'Zone B (Inland East)', size: '40HC', amount: 220 }
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-1',
    quoteNo: 'QT-2026-0001',
    tenantId: 'tenant-1',
    customerId: 'cust-1', // Pacific Furniture
    status: 'confirmed',
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    rates: [
      {
        id: 'qr-1',
        scenario: 'IMP',
        fromLocationId: 'loc-port-1',
        toLocationId: 'loc-cust-1',
        containerSize: '40HC',
        baseRate: 520,
        additionalSurcharges: [
          { code: 'FAF', amount: 45 },
          { code: 'PORT_FEE', amount: 80 }
        ]
      },
      {
        id: 'qr-2',
        scenario: 'RETURN',
        fromLocationId: 'loc-cust-1',
        toLocationId: 'loc-depot-1',
        containerSize: '40HC',
        baseRate: 220,
        additionalSurcharges: [
          { code: 'FAF', amount: 15 }
        ]
      }
    ],
    surcharges: [
      { code: 'FAF', name: 'Fuel Adjustment Factor (FAF)', amount: 45, unit: 'Flat % on Base Rate', autoTrigger: 'Always' },
      { code: 'PORT_FEE', name: 'Port Terminal Gate Fee', amount: 80, unit: 'Per Gate Action', autoTrigger: 'IMP / EXP actions' }
    ],
    notes: 'Rates guaranteed for contractual volume of minimum 50 TEU monthly. Subject to terminal storage delays.'
  },
  {
    id: 'quote-2',
    quoteNo: 'QT-2026-0002',
    tenantId: 'tenant-1',
    customerId: 'cust-2', // Zenith Electronics
    status: 'confirmed',
    effectiveDate: '2026-02-15',
    expiryDate: '2026-12-31',
    rates: [
      {
        id: 'qr-3',
        scenario: 'EXP',
        fromLocationId: 'loc-depot-1',
        toLocationId: 'loc-cust-2',
        containerSize: '40GP',
        baseRate: 400,
        additionalSurcharges: [
          { code: 'FAF', amount: 45 },
          { code: 'PORT_FEE', amount: 80 }
        ]
      }
    ],
    surcharges: [
      { code: 'FAF', name: 'Fuel Adjustment (FAF)', amount: 45, unit: 'Flat % on Base Rate', autoTrigger: 'Always' },
      { code: 'WASH_FEE', name: 'Hazmat Steam Wash', amount: 150, unit: 'Per Wash', autoTrigger: 'On demand' }
    ],
    notes: 'Urgent priority high-value electronics transit clauses included.'
  },
  {
    id: 'quote-3',
    quoteNo: 'QT-2026-0003',
    tenantId: 'tenant-1',
    customerId: 'cust-3', // Apex Agri
    status: 'draft',
    effectiveDate: '2026-05-10',
    expiryDate: '2026-08-31',
    rates: [
      {
        id: 'qr-4',
        scenario: 'IMP',
        fromLocationId: 'loc-port-1',
        toLocationId: 'loc-cust-3',
        containerSize: '20GP',
        baseRate: 350,
        additionalSurcharges: [
          { code: 'FAF', amount: 35 }
        ]
      }
    ],
    surcharges: [
      { code: 'FAF', name: 'Fuel Adjustment (FAF)', amount: 35, unit: 'Flat Rate', autoTrigger: 'Always' }
    ]
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
    extraSurchargesIncurred: []
  },
  {
    id: 'job-2',
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
    extraSurchargesIncurred: []
  },
  {
    id: 'job-3',
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
    extraSurchargesIncurred: []
  }
];

export const INITIAL_ROTS: ROT[] = [
  { id: 'rot-1', jobId: 'job-1', rotNo: 'ROT-992110', status: 'confirmed', gateReleaseCode: 'REL-MSC-84192', depotExpiry: '2026-05-30', verifiedBy: 'Office Dispatch Admin' },
  { id: 'rot-2', jobId: 'job-2', rotNo: 'ROT-554109', status: 'draft', gateReleaseCode: 'REL-CMA-22180', depotExpiry: '2026-06-02' }
];

export const INITIAL_CONS_NOTES: ConsignmentNote[] = [
  { id: 'cn-1', jobId: 'job-1', cnNo: 'CN-2026-88001', status: 'issued', printed: true },
  { id: 'cn-2', jobId: 'job-2', cnNo: 'CN-2026-88002', status: 'draft', printed: false }
];

export const DEFAULT_ZONES: Zone[] = [
  { id: 'zone-a', name: 'Zone A (Port Gates)', code: 'ZN-PRT-A', type: 'Port Sector', description: 'Horizon terminal docks and customs bypass precinct.' },
  { id: 'zone-b', name: 'Zone B (Inland East)', code: 'ZN-INL-B', type: 'Inland Corridor', description: 'Depot dry-stacks and eastern transfer terminals.' },
  { id: 'zone-c', name: 'Zone C (North Coast)', code: 'ZN-NTH-C', type: 'Industrial Hub', description: 'Northern seaside chemical and heavy engineering complexes.' },
  { id: 'zone-d', name: 'Zone D (West Industrial)', code: 'ZN-WST-D', type: 'Industrial Hub', description: 'Western dry cargo warehouses and furniture plants.' }
];

export const DEFAULT_ZONE_TYPES: ZoneType[] = [
  { id: 'zt-1', name: 'Port Sector', description: 'Terminal gate docks under strict customs control.' },
  { id: 'zt-2', name: 'Inland Corridor', description: 'Expressway routes mapping inland dry stack transfer depots.' },
  { id: 'zt-3', name: 'Industrial Hub', description: 'Factories, stuffing plants, and consumer distribution parks.' }
];

export const INITIAL_USERS: User[] = [
  { id: 'user-admin', name: 'Office Administrator', email: 'admin@atlas-haulage.com', role: 'administrator', isActive: true },
  { id: 'user-dispatch', name: 'Dispatch Board Coordinator', email: 'dispatch@atlas-haulage.com', role: 'dispatcher', isActive: true },
  { id: 'user-billing', name: 'Billing Specialist', email: 'billing@atlas-haulage.com', role: 'billing', isActive: true },
  { id: 'user-driver', name: 'Bob Johnson', email: 'driver@atlas-haulage.com', role: 'driver_emulator', isActive: true }
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

