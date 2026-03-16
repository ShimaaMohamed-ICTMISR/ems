import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLeads, getOpportunities } from "../api/opportunityApi";
import type { Lead, Opportunity } from "../types/opportunity.types";

export function OpportunitiesDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, opportunitiesData] = await Promise.all([
        getLeads(),
        getOpportunities(),
      ]);
      setLeads(leadsData);
      setOpportunities(opportunitiesData);
      setError(null);
    } catch (err: any) {
      console.error("Error loading opportunity data:", err);
      setError("Unable to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "PROSPECTING":
        return "bg-info";
      case "QUALIFICATION":
        return "bg-warning";
      case "PROPOSAL":
        return "bg-primary";
      case "NEGOTIATION":
        return "bg-secondary";
      case "CLOSED_WON":
        return "bg-success";
      case "CLOSED_LOST":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-info";
      case "CONTACTED":
        return "bg-warning";
      case "QUALIFIED":
        return "bg-success";
      case "UNQUALIFIED":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading opportunities...</h5>
          <p className="text-muted small">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalOpportunityValue = opportunities.reduce(
    (sum, opp) => sum + opp.expectedValue,
    0,
  );
  const wonOpportunities = opportunities.filter(
    (opp) => opp.stage === "CLOSED_WON",
  );
  const totalWonValue = wonOpportunities.reduce(
    (sum, opp) => sum + (opp.actualValue || opp.expectedValue),
    0,
  );
  const qualifiedLeads = leads.filter((lead) => lead.status === "QUALIFIED");
  const activeOpportunities = opportunities.filter(
    (opp) => !["CLOSED_WON", "CLOSED_LOST"].includes(opp.stage),
  );

  return (
    <div className="container-fluid py-4">
      {/* Enhanced Header */}
      <div className="row align-items-center mb-5">
        <div className="col-lg-8">
          <div className="d-flex align-items-center mb-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-4"
              style={{
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 8px 25px rgba(5, 150, 105, 0.3)",
              }}
            >
              <i className="bi bi-graph-up-arrow text-white fs-3"></i>
            </div>
            <div>
              <h1
                className="mb-1 fw-bold"
                style={{ color: "#0f172a", fontSize: "2.5rem" }}
              >
                Opportunities
              </h1>
              <p className="text-muted mb-0 fs-5">
                Manage your sales pipeline and drive revenue growth
              </p>
            </div>
          </div>
        </div>
        <div className="col-lg-4 text-lg-end">
          <div className="d-flex flex-column flex-lg-row gap-2 justify-content-lg-end">
            <Link
              to="/opportunities/leads/create"
              className="btn btn-outline-success btn-lg"
              style={{ borderWidth: "2px" }}
            >
              <i className="bi bi-person-plus me-2"></i>
              Add Lead
            </Link>
            <Link
              to="/opportunities/create"
              className="btn btn-lg text-white"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                border: "none",
                boxShadow: "0 4px 15px rgba(5, 150, 105, 0.3)",
              }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Opportunity
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger border-0 mb-4"
          role="alert"
          style={{ borderRadius: "12px" }}
        >
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div className="flex-grow-1">
              <h6 className="mb-1 fw-bold">Unable to Load Data</h6>
              <p className="mb-0">{error}</p>
            </div>
            <button className="btn btn-outline-danger" onClick={loadData}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-6 col-xl-3">
          <div
            className="card border-0 h-100 position-relative overflow-hidden"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.08)",
              background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-2 fw-bold">
                    Total Leads
                  </h6>
                  <h2
                    className="mb-0 fw-bold"
                    style={{ color: "#0f172a", fontSize: "2.5rem" }}
                  >
                    {leads.length}
                  </h2>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "56px",
                    height: "56px",
                    background:
                      "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    boxShadow: "0 8px 25px rgba(5, 150, 105, 0.3)",
                  }}
                >
                  <i className="bi bi-people text-white fs-4"></i>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <span
                  className="badge me-2 px-3 py-2"
                  style={{
                    backgroundColor: "#d1fae5",
                    color: "#059669",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                  }}
                >
                  {qualifiedLeads.length} qualified
                </span>
                <small className="text-muted">Ready for conversion</small>
              </div>
            </div>
            <div
              className="position-absolute bottom-0 start-0 w-100"
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
              }}
            ></div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div
            className="card border-0 h-100 position-relative overflow-hidden"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.08)",
              background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-2 fw-bold">
                    Active Pipeline
                  </h6>
                  <h2
                    className="mb-0 fw-bold"
                    style={{ color: "#0f172a", fontSize: "2.5rem" }}
                  >
                    {activeOpportunities.length}
                  </h2>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "56px",
                    height: "56px",
                    background:
                      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                    boxShadow: "0 8px 25px rgba(30, 64, 175, 0.3)",
                  }}
                >
                  <i className="bi bi-graph-up text-white fs-4"></i>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-currency-dollar me-1 text-success"></i>
                <small className="text-muted">
                  {formatCurrency(totalOpportunityValue)} potential
                </small>
              </div>
            </div>
            <div
              className="position-absolute bottom-0 start-0 w-100"
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)",
              }}
            ></div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div
            className="card border-0 h-100 position-relative overflow-hidden"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.08)",
              background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-2 fw-bold">
                    Won Deals
                  </h6>
                  <h2
                    className="mb-0 fw-bold"
                    style={{ color: "#0f172a", fontSize: "2.5rem" }}
                  >
                    {wonOpportunities.length}
                  </h2>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "56px",
                    height: "56px",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                    boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <i className="bi bi-trophy text-white fs-4"></i>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-arrow-up-right me-1 text-success"></i>
                <small className="text-muted">
                  {formatCurrency(totalWonValue)} revenue
                </small>
              </div>
            </div>
            <div
              className="position-absolute bottom-0 start-0 w-100"
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
              }}
            ></div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div
            className="card border-0 h-100 position-relative overflow-hidden"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.08)",
              background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-2 fw-bold">
                    Success Rate
                  </h6>
                  <h2
                    className="mb-0 fw-bold"
                    style={{ color: "#0f172a", fontSize: "2.5rem" }}
                  >
                    {opportunities.length > 0
                      ? Math.round(
                          (wonOpportunities.length / opportunities.length) *
                            100,
                        )
                      : 0}
                    %
                  </h2>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "56px",
                    height: "56px",
                    background:
                      "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
                    boxShadow: "0 8px 25px rgba(217, 119, 6, 0.3)",
                  }}
                >
                  <i className="bi bi-percent text-white fs-4"></i>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-target me-1 text-warning"></i>
                <small className="text-muted">Conversion efficiency</small>
              </div>
            </div>
            <div
              className="position-absolute bottom-0 start-0 w-100"
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #d97706 0%, #f59e0b 100%)",
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              className="card-header border-0 py-4"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  }}
                >
                  <i className="bi bi-lightning text-white fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-1 fw-bold" style={{ color: "#0f172a" }}>
                    Quick Actions
                  </h5>
                  <p className="text-muted mb-0 small">
                    Streamline your sales workflow
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <Link
                    to="/opportunities/leads"
                    className="btn btn-outline-primary w-100 text-start p-3 h-100"
                    style={{ borderRadius: "12px", borderWidth: "2px" }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#e0f2fe",
                        }}
                      >
                        <i className="bi bi-people text-primary"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">Manage Leads</div>
                        <small className="text-muted">
                          View and qualify leads
                        </small>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link
                    to="/opportunities/pipeline"
                    className="btn btn-outline-primary w-100 text-start p-3 h-100"
                    style={{ borderRadius: "12px", borderWidth: "2px" }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#e0f2fe",
                        }}
                      >
                        <i className="bi bi-kanban text-primary"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">Sales Pipeline</div>
                        <small className="text-muted">
                          Track opportunity stages
                        </small>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link
                    to="/opportunities/quotes"
                    className="btn btn-outline-primary w-100 text-start p-3 h-100"
                    style={{ borderRadius: "12px", borderWidth: "2px" }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#e0f2fe",
                        }}
                      >
                        <i className="bi bi-file-earmark-text text-primary"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">Quotes & Proposals</div>
                        <small className="text-muted">
                          Manage quotes and approvals
                        </small>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link
                    to="/opportunities/reports"
                    className="btn btn-outline-primary w-100 text-start p-3 h-100"
                    style={{ borderRadius: "12px", borderWidth: "2px" }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#e0f2fe",
                        }}
                      >
                        <i className="bi bi-graph-up-arrow text-primary"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">Sales Reports</div>
                        <small className="text-muted">
                          Analytics and insights
                        </small>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 25px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              className="card-header border-0 py-4"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                borderRadius: "16px 16px 0 0",
              }}
            >
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                  }}
                >
                  <i className="bi bi-clock text-white fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-1 fw-bold" style={{ color: "#0f172a" }}>
                    Recent Activity
                  </h6>
                  <p className="text-muted mb-0 small">Latest updates</p>
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="text-center py-5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#f1f5f9",
                  }}
                >
                  <i
                    className="bi bi-clock-history text-muted"
                    style={{ fontSize: "2rem" }}
                  ></i>
                </div>
                <h6 className="text-muted mb-2">No recent activity</h6>
                <p className="text-muted small mb-0">
                  Activity will appear here when you start working with
                  opportunities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
