export const OPPORTUNITY_PERMISSION_KEYS = {
	OPPORTUNITIES: {
		LIST: ['Opportunities.List', 'Opportunity.List'],
		VIEW: [
			'Opportunities.View',
			'Opportunity.View',
			'Opportunities.Read',
			'Opportunity.Read',
		],
		CREATE: ['Opportunities.Create', 'Opportunity.Create'],
		EDIT: [
			'Opportunities.Edit',
			'Opportunity.Edit',
			'Opportunities.Update',
			'Opportunity.Update',
		],
		DELETE: ['Opportunities.Delete', 'Opportunity.Delete'],
		CHANGE_STAGE: [
			'Opportunities.ChangeStage',
			'Opportunity.ChangeStage',
			'Opportunities.Stage.Change',
			'Opportunity.Stage.Change',
		],
		ASSIGN: ['Opportunities.Assign', 'Opportunity.Assign'],
		CLOSE: ['Opportunities.Close', 'Opportunity.Close'],
		HISTORY_VIEW: ['Opportunities.History.View', 'Opportunity.History.View'],
	},
	LEADS: {
		LIST: ['Leads.List', 'Lead.List'],
		VIEW: ['Leads.View', 'Lead.View', 'Leads.Read', 'Lead.Read'],
		CREATE: ['Leads.Create', 'Lead.Create'],
		QUALIFY: ['Leads.Qualify', 'Lead.Qualify'],
		CONVERT: [
			'Leads.Convert',
			'Lead.Convert',
			'Leads.ConvertToOpportunity',
			'Lead.ConvertToOpportunity',
		],
		DELETE: ['Leads.Delete', 'Lead.Delete'],
	},
	QUOTES: {
		VIEW: ['Quotes.View', 'Quote.View', 'Quotes.Read', 'Quote.Read'],
		CREATE: [
			'Quotes.Create',
			'Quote.Create',
			'Opportunities.Quotes.Create',
			'Opportunity.Quotes.Create',
		],
		APPROVE: [
			'Quotes.Approve',
			'Quote.Approve',
			'Opportunities.Quotes.Approve',
			'Opportunity.Quotes.Approve',
		],
	},
} as const;

const unique = (permissionKeys: readonly string[]): string[] =>
	Array.from(new Set(permissionKeys));

export const OPPORTUNITY_ROUTE_PERMISSION_KEYS = {
	HOME: unique([
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.LIST,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.VIEW,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.CREATE,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.EDIT,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.DELETE,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.CHANGE_STAGE,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.ASSIGN,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.CLOSE,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.HISTORY_VIEW,
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.LIST,
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.VIEW,
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.CREATE,
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.QUALIFY,
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.CONVERT,
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.DELETE,
		...OPPORTUNITY_PERMISSION_KEYS.QUOTES.VIEW,
		...OPPORTUNITY_PERMISSION_KEYS.QUOTES.CREATE,
		...OPPORTUNITY_PERMISSION_KEYS.QUOTES.APPROVE,
	]),
	DASHBOARD: unique([
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.LIST,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.VIEW,
	]),
	DETAILS: unique([
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.LIST,
		...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.VIEW,
	]),
	LEADS: unique([
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.LIST,
		...OPPORTUNITY_PERMISSION_KEYS.LEADS.VIEW,
	]),
	HISTORY: unique([...OPPORTUNITY_PERMISSION_KEYS.OPPORTUNITIES.HISTORY_VIEW]),
} as const;

export type OpportunityPermissionDomain =
	keyof typeof OPPORTUNITY_PERMISSION_KEYS;
