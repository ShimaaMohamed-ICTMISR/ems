import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import portfolioService from "../services/portfolioService";
import { resourceService } from "../services/resourceService";
import { resourceRequestService } from "../services/resourceService";
import "./styles/ProjectManagement.css";

interface DashboardStats {
  totalPortfolios: number;
  totalProjects: number;
  totalResources: number;
  activeRequests: number;
}

export function ProjectManagement() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPortfolios: 0,
    totalProjects: 0,
    totalResources: 0,
    activeRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const [portfolios, resources, requests] = await Promise.all([
          portfolioService.getPortfolios(),
          resourceService.getAll(),
          resourceRequestService.getAll(),
        ]);

        const totalProjects = portfolios.reduce(
          (sum, p) => sum + (p.projects?.length || 0),
          0,
        );

        const activeRequests = requests.filter(
          (r) => r.status === 0 || r.status === 1,
        ).length;

        setStats({
          totalPortfolios: portfolios.length,
          totalProjects,
          totalResources: resources.length,
          activeRequests,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const navCards = [
    {
      icon: "bi-briefcase-fill",
      title: "Portfolios",
      description: "Manage project portfolios and grouped initiatives",
      path: "/dashboard/project-management/portfolios",
      color: "#0ea5e9",
    },
    {
      icon: "bi-box-seam",
      title: "Resources",
      description: "Manage people, teams, and equipment allocations",
      path: "/dashboard/project-management/resources",
      color: "#8b5cf6",
    },
    {
      icon: "bi-send-check",
      title: "Resource Requests",
      description: "Review and approve resource allocation requests",
      path: "/dashboard/project-management/resource-requests",
      color: "#f59e0b",
    },
  ];

  const statWidgets = [
    {
      label: "Total Portfolios",
      value: stats.totalPortfolios,
      icon: "bi-briefcase",
      color: "#0ea5e9",
    },
    {
      label: "Total Projects",
      value: stats.totalProjects,
      icon: "bi-kanban",
      color: "#10b981",
    },
    {
      label: "Resources",
      value: stats.totalResources,
      icon: "bi-box-seam",
      color: "#8b5cf6",
    },
    {
      label: "Active Requests",
      value: stats.activeRequests,
      icon: "bi-send-check",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="pm-dashboard-page">
      {/* Hero */}
      <section className="pm-dashboard-hero">
        <div>
          <p className="pm-dashboard-kicker">Project Management</p>
          <h1 className="pm-dashboard-title">Dashboard</h1>
          <p className="pm-dashboard-subtitle">
            Overview of your project management ecosystem. Navigate to modules
            or review key metrics below.
          </p>
        </div>
      </section>

      {/* Stat Widgets */}
      <section className="pm-stat-grid">
        {statWidgets.map((w) => (
          <div key={w.label} className="pm-stat-card">
            <div
              className="pm-stat-icon"
              style={{ background: `${w.color}20`, color: w.color }}
            >
              <i className={`bi ${w.icon}`} />
            </div>
            <div className="pm-stat-info">
              <span className="pm-stat-label">{w.label}</span>
              <span className="pm-stat-value">
                {loading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  w.value
                )}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Navigation */}
      <section className="pm-nav-section">
        <h2 className="pm-section-title">
          <i className="bi bi-grid me-2" />
          Quick Navigation
        </h2>
        <div className="pm-nav-grid">
          {navCards.map((card) => (
            <button
              key={card.title}
              type="button"
              className="pm-nav-card"
              onClick={() => navigate(card.path)}
            >
              <div
                className="pm-nav-card-icon"
                style={{ background: `${card.color}15`, color: card.color }}
              >
                <i className={`bi ${card.icon}`} />
              </div>
              <div className="pm-nav-card-body">
                <h3 className="pm-nav-card-title">{card.title}</h3>
                <p className="pm-nav-card-desc">{card.description}</p>
              </div>
              <i className="bi bi-chevron-right pm-nav-card-arrow" />
            </button>
          ))}
        </div>
      </section>

      {/* Future Widgets Placeholder */}
      <section className="pm-widgets-section">
        <h2 className="pm-section-title">
          <i className="bi bi-bar-chart-line me-2" />
          Insights
        </h2>
        <div className="pm-widgets-grid">
          <div className="pm-widget-placeholder">
            <i className="bi bi-graph-up-arrow" />
            <span>Task Analytics</span>
            <small>Coming soon</small>
          </div>
          <div className="pm-widget-placeholder">
            <i className="bi bi-flag" />
            <span>Milestones Tracking</span>
            <small>Coming soon</small>
          </div>
          <div className="pm-widget-placeholder">
            <i className="bi bi-heart-pulse" />
            <span>Project Health</span>
            <small>Coming soon</small>
          </div>
          <div className="pm-widget-placeholder">
            <i className="bi bi-activity" />
            <span>Activity Feed</span>
            <small>Coming soon</small>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProjectManagement;
