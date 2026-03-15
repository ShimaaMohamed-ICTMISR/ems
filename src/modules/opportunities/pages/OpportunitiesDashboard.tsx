import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLeads, getOpportunities } from '../api/opportunityApi';
import type { Lead, Opportunity } from '../types/opportunity.types';

// Mock data for demonstration while CORS is being fixed
const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    company: 'Tech Corp',
    jobTitle: 'CTO',
    source: 'Website',
    status: 'QUALIFIED',
    notes: 'Interested in enterprise solution',
    assignedTo: 'sales-rep-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@startup.com',
    phone: '+1-555-0124',
    company: 'StartupXYZ',
    jobTitle: 'CEO',
    source: 'Referral',
    status: 'CONTACTED',
    notes: 'Follow up next week',
    assignedTo: 'sales-rep-2',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z'
  }
];

const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Tech Corp Enterprise Deal',
    description: 'Large enterprise software implementation',
    expectedValue: 150000,
    probability: 75,
    stage: 'PROPOSAL',
    expectedCloseDate: '2024-03-15T00:00:00Z',
    leadId: '1',
    assignedTo: 'sales-rep-1',
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:00:00Z'
  },
  {
    id: '2',
    title: 'StartupXYZ SaaS Package',
    description: 'Monthly SaaS subscription for growing startup',
    expectedValue: 25000,
    probability: 60,
    stage: 'QUALIFICATION',
    expectedCloseDate: '2024-02-28T00:00:00Z',
    leadId: '2',
    assignedTo: 'sales-rep-2',
    createdBy: 'user-2',
    createdAt: '2024-01-14T11:00:00Z',
    updatedAt: '2024-01-18T16:30:00Z'
  },
  {
    id: '3',
    title: 'Manufacturing Solutions',
    description: 'Custom manufacturing software solution',
    expectedValue: 85000,
    actualValue: 90000,
    probability: 100,
    stage: 'CLOSED_WON',
    expectedCloseDate: '2024-01-30T00:00:00Z',
    actualCloseDate: '2024-01-28T00:00:00Z',
    assignedTo: 'sales-rep-1',
    createdBy: 'user-1',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-28T17:00:00Z'
  }
];

export function OpportunitiesDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, opportunitiesData] = await Promise.all([
        getLeads(),
        getOpportunities()
      ]);
      setLeads(leadsData);
      setOpportunities(opportunitiesData);
      setError(null);
      setUsingMockData(false);
    } catch (err: any) {
      console.error('Error loading opportunity data:', err);
      
      // Check if it's a CORS error
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        console.log('CORS error detected, using mock data for demonstration');
        setLeads(mockLeads);
        setOpportunities(mockOpportunities);
        setError('Backend service unavailable (CORS issue) - showing demo data');
        setUsingMockData(true);
      } else {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECTING': return 'bg-info';
      case 'QUALIFICATION': return 'bg-warning';
      case 'PROPOSAL': return 'bg-primary';
      case 'NEGOTIATION': return 'bg-secondary';
      case 'CLOSED_WON': return 'bg-success';
      case 'CLOSED_LOST': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-info';
      case 'CONTACTED': return 'bg-warning';
      case 'QUALIFIED': return 'bg-success';
      case 'UNQUALIFIED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + opp.expectedValue, 0);
  const wonOpportunities = opportunities.filter(opp => opp.stage === 'CLOSED_WON');
  const totalWonValue = wonOpportunities.reduce((sum, opp) => sum + (opp.actualValue || opp.expectedValue), 0);
  const qualifiedLeads = leads.filter(lead => lead.status === 'QUALIFIED');

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: '#0f172a' }}>
            <i className="bi bi-graph-up-arrow me-3" style={{ color: '#059669' }}></i>
            Opportunities
          </h2>
          <p className="text-muted mb-0">Manage your sales pipeline and leads</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/opportunities/leads/create" className="btn btn-outline-primary">
            <i className="bi bi-person-plus me-2"></i>
            Add Lead
          </Link>
          <Link to="/opportunities/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Create Opportunity
          </Link>
        </div>
      </div>

      {error && (
        <div className={`alert ${usingMockData ? 'alert-warning' : 'alert-danger'}`} role="alert">
          <div className="d-flex align-items-center">
            <i className={`bi ${usingMockData ? 'bi-exclamation-triangle' : 'bi-x-circle'} me-2`}></i>
            <div className="flex-grow-1">
              <strong>{usingMockData ? 'Demo Mode' : 'Error'}</strong>
              <div>{error}</div>
              {usingMockData && (
                <small className="text-muted">
                  The backend needs CORS configuration to allow requests from localhost:5173
                </small>
              )}
            </div>
            {usingMockData && (
              <button 
                className="btn btn-outline-warning btn-sm"
                onClick={loadData}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #059669' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Total Leads</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>{leads.length}</h2>
                </div>
                <div style={{ backgroundColor: '#d1fae5', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-people fs-5" style={{ color: '#059669' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <span className="badge bg-success me-2">{qualifiedLeads.length}</span>
                <small>Qualified leads</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #1e40af' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Active Opportunities</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>{opportunities.length}</h2>
                </div>
                <div style={{ backgroundColor: '#e0e7ff', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-graph-up fs-5" style={{ color: '#1e40af' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-arrow-up me-1"></i>
                <small>Pipeline value: {formatCurrency(totalOpportunityValue)}</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Won Deals</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>{wonOpportunities.length}</h2>
                </div>
                <div style={{ backgroundColor: '#d1fae5', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-trophy fs-5" style={{ color: '#10b981' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-currency-dollar me-1"></i>
                <small>Revenue: {formatCurrency(totalWonValue)}</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #d97706' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Conversion Rate</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                    {leads.length > 0 ? Math.round((wonOpportunities.length / leads.length) * 100) : 0}%
                  </h2>
                </div>
                <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-percent fs-5" style={{ color: '#d97706' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-graph-up me-1"></i>
                <small>Leads to wins</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3" style={{ borderLeft: '4px solid #059669' }}>
              <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                <i className="bi bi-lightning me-2" style={{ color: '#059669' }}></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <Link to="/opportunities/leads" className="btn btn-outline-primary w-100 text-start">
                    <i className="bi bi-people me-2"></i>
                    Manage Leads
                    <small className="d-block text-muted">View and qualify leads</small>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/opportunities/pipeline" className="btn btn-outline-primary w-100 text-start">
                    <i className="bi bi-kanban me-2"></i>
                    Sales Pipeline
                    <small className="d-block text-muted">Track opportunity stages</small>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/opportunities/quotes" className="btn btn-outline-primary w-100 text-start">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Quotes & Proposals
                    <small className="d-block text-muted">Manage quotes and approvals</small>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/opportunities/reports" className="btn btn-outline-primary w-100 text-start">
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    Sales Reports
                    <small className="d-block text-muted">Analytics and insights</small>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3" style={{ borderLeft: '4px solid #1e40af' }}>
              <h6 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                <i className="bi bi-clock me-2" style={{ color: '#1e40af' }}></i>
                Recent Activity
              </h6>
            </div>
            <div className="card-body">
              <div className="text-center text-muted py-4">
                <i className="bi bi-clock-history fs-1 mb-3"></i>
                <p className="mb-0">No recent activity</p>
                <small>Activity will appear here</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}