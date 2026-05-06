export interface CuttingRecord {
  id: string;
  timestamp: number;
  cutterName: string;
  wireId: string;
  orderNumber: string;
  customerName: string;
  cutLength: number;
  cutLengthUnit: 'm' | 'ft';
  lineCode: string;
  turnedToLineCode: string;
  coilOrReel: 'coil' | 'reel';
  reelSize?: number;
  chargeable: 'yes' | 'no';
  isFullPick: boolean;
  isNoMarks: boolean;
  isSystemCut: boolean;
  isCutInSystem: boolean;
  cutInSystemTimestamp?: number;
  startingMark?: number | null;
  startingMarkUnit?: 'm' | 'ft';
  endingMark?: number | null;
  createdAt: number;
  updatedAt: number;
  orderComments?: string;
  isSingleUnitCut?: boolean;
}

export interface InventoryRecord {
  id: string;
  wireType: string;
  personName: string;
  productCode: string;
  lineCode: string;
  actualLength: number;
  updatedAt: number;
  timestamp: number;
  [key: string]: any;
}

export interface User {
  id: string;
  role: string;
  active: boolean;
  lastLogin: number;
  createdAt: number;
}

export interface Notification {
  id: string;
  type: string;
  priority: string;
  recipients: string[];
  timestamp: number;
  read: boolean;
}

export interface MaintenanceLog {
  id: string;
  equipment: string;
  technician: string;
  dueDate: number;
  completed: boolean;
  timestamp: number;
}

export interface ToolRecord {
  id: string;
  tool: string;
  timestamp: number;
  [key: string]: any;
}

export interface MultiCutPlannerRecord {
  id: string;
  timestamp: number;
  payloadCableType: string;
  isComplete: boolean;
  totalPayloadLength: number;
}

export interface CalibrationMeasurement {
  id: string;
  machineName: string;
  measurement: number;
  timestamp: number;
}

export interface WireCutListItem {
  id: string;
  timestamp: number;
  orderNumber: string;
  lineNumber: string;
  customerName: string;
  wireType: string;
  lengthZ: string;
  urgency: 'normal' | 'rush' | 'critical';
  status: 'active' | 'completed' | 'removed';
  position: number;
  description?: string;
  orderComments?: string;
  shipperComments?: string;
  color?: string;
  updatedAt?: number;
}
