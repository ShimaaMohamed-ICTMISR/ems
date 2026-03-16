// All Project Management enums — zero-indexed unless otherwise noted.
// API expects numeric values.

export const ProjectStage: Record<number, string> = {
  0: 'Initiation',
  1: 'Planning',
  2: 'Execution',
  3: 'Monitoring',
  4: 'Closing',
};

export const HealthStatus: Record<number, string> = {
  0: 'Green',
  1: 'Yellow',
  2: 'Red',
};

export const MethodologyType: Record<number, string> = {
  0: 'Waterfall',
  1: 'Agile',
  2: 'Hybrid',
};

// PriorityLevel starts at 1
export const PriorityLevel: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

export const TaskStatus: Record<number, string> = {
  0: 'Backlog',
  1: 'Not Started',
  2: 'In Progress',
  3: 'Blocked',
  4: 'In Review',
  5: 'Done',
  6: 'Cancelled',
};

export const DependencyType: Record<number, string> = {
  0: 'Finish To Start',
  1: 'Start To Start',
  2: 'Finish To Finish',
  3: 'Start To Finish',
};

export const ApprovalStatus: Record<number, string> = {
  0: 'Draft',
  1: 'Submitted',
  2: 'Pending',
  3: 'Approved',
  4: 'Rejected',
};

export const DocumentType: Record<number, string> = {
  0: 'Plan',
  1: 'Specification',
  2: 'Design',
  3: 'Report',
  4: 'Contract',
  5: 'Other',
};

export const ResourceType: Record<number, string> = {
  0: 'Person',
  1: 'Equipment',
  2: 'License',
  3: 'Contractor',
};

export const RequestStatus: Record<number, string> = {
  0: 'Requested',
  1: 'Pending Approval',
  2: 'Allocated',
  3: 'Declined',
  4: 'Cancelled',
};

export const BudgetCategory: Record<number, string> = {
  0: 'Labor',
  1: 'Infrastructure',
  2: 'Licensing',
  3: 'Vendor',
  4: 'Training',
  5: 'Miscellaneous',
};

export const RiskProbability: Record<number, string> = {
  0: 'Rare',
  1: 'Unlikely',
  2: 'Possible',
  3: 'Likely',
  4: 'Almost Certain',
};

export const RiskImpact: Record<number, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Critical',
};

export const RiskEventStatus: Record<number, string> = {
  0: 'Open',
  1: 'Mitigated',
  2: 'Realized',
  3: 'Closed',
};

export const ChangeType: Record<number, string> = {
  0: 'Scope',
  1: 'Schedule',
  2: 'Cost',
  3: 'Quality',
  4: 'Resource',
  5: 'Technical',
};

export const ChangeStatus: Record<number, string> = {
  0: 'Requested',
  1: 'Under Review',
  2: 'Approved',
  3: 'Rejected',
  4: 'Implemented',
};

export const ProjectDependencyType: Record<number, string> = {
  0: 'Blocking',
  1: 'Related',
  2: 'External',
};
