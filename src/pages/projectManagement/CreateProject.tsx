import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import projectService, {
  type ProjectCreateDTO,
} from "../../services/projectManagementServices/projectService";

import portfolioService, { type Portfolio } from "../../services/projectManagementServices/portfolioService";
import { ProjectStage, HealthStatus, MethodologyType } from "../../config/enums";
import ".././styles/CreateProject.css";

function safeInt(value: string | undefined, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

type FormState = {
  name: string;
  objectives: string;
  scope: string;
  startDateUtc: string;
  endDateUtc: string;
  stage: string;
  healthStatus: string;
  methodology: string;
  portfolioId: string;
  templateId: string;
};

const initialFormState: FormState = {
  name: "",
  objectives: "",
  scope: "",
  startDateUtc: "",
  endDateUtc: "",
  stage: "0",
  healthStatus: "0",
  methodology: "0",
  portfolioId: "",
  templateId: "",
};

export function CreateProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPortfolioId = searchParams.get("portfolioId")?.trim() || "";
  const [submitting, setSubmitting] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [form, setForm] = useState<FormState>(() => {
    return { ...initialFormState, portfolioId: selectedPortfolioId };
  });

  const visiblePortfolios = useMemo(() => {
    if (!selectedPortfolioId) {
      return portfolios;
    }

    return portfolios.filter(
      (portfolio) => portfolio.id === selectedPortfolioId,
    );
  }, [portfolios, selectedPortfolioId]);

  useEffect(() => {
    portfolioService
      .getPortfolios()
      .then((data) => setPortfolios(data || []))
      .catch(() => {});
  }, []);

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      toast.error("Project name is required.");
      return;
    }

    const payload: ProjectCreateDTO = {
      name,
      objectives: form.objectives.trim() || undefined,
      scope: form.scope.trim() || undefined,
      startDateUtc: form.startDateUtc
        ? new Date(form.startDateUtc).toISOString()
        : undefined,
      endDateUtc: form.endDateUtc
        ? new Date(form.endDateUtc).toISOString()
        : undefined,
      stage: safeInt(form.stage),
      healthStatus: safeInt(form.healthStatus),
      methodology: safeInt(form.methodology),
      portfolioId: form.portfolioId.trim() || undefined,
      templateId: form.templateId.trim() || undefined,
    };

    try {
      setSubmitting(true);
      await projectService.createProject(payload);
      toast.success("Project created successfully.");
      if (form.portfolioId) {
        navigate("/dashboard/portfolios");
      } else {
        navigate("/portfolios");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="create-project-page">
      <div className="create-project-container">
        <header className="create-project-header">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left" />
            <span>Back</span>
          </button>
          <div>
            <p className="create-project-kicker">Project Administration</p>
            <h1 className="create-project-title">Create New Project</h1>
            <p className="create-project-subtitle">
              Fill in the details below to set up a new project.
            </p>
          </div>
        </header>

        <form className="create-project-form" onSubmit={handleSubmit}>
          {/* ── Basic Info ── */}
          <section className="form-section">
            <h2 className="form-section-title">
              <i className="bi bi-info-circle" />
              Basic Information
            </h2>
            <div className="form-grid">
              <div className="form-field span-2">
                <label className="form-label" htmlFor="cp-name">
                  Project Name <span className="required">*</span>
                </label>
                <input
                  id="cp-name"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  maxLength={150}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="cp-portfolio">
                  Portfolio
                </label>
                <select
                  id="cp-portfolio"
                  className="form-select"
                  name="portfolioId"
                  value={form.portfolioId}
                  onChange={handleChange}
                  disabled={!!selectedPortfolioId}
                >
                  {!selectedPortfolioId && (
                    <option value="">No portfolio</option>
                  )}
                  {visiblePortfolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="cp-template">
                  Template ID
                </label>
                <input
                  id="cp-template"
                  className="form-control"
                  name="templateId"
                  value={form.templateId}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>
          </section>

          {/* ── Status & Methodology ── */}
          <section className="form-section">
            <h2 className="form-section-title">
              <i className="bi bi-sliders" />
              Status & Methodology
            </h2>
            <div className="form-grid cols-3">
              <div className="form-field">
                <label className="form-label" htmlFor="cp-stage">
                  Stage
                </label>
                <select
                  id="cp-stage"
                  className="form-select"
                  name="stage"
                  value={form.stage}
                  onChange={handleChange}
                >
                  {Object.entries(ProjectStage).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="cp-health">
                  Health Status
                </label>
                <select
                  id="cp-health"
                  className="form-select"
                  name="healthStatus"
                  value={form.healthStatus}
                  onChange={handleChange}
                >
                  {Object.entries(HealthStatus).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="cp-methodology">
                  Methodology
                </label>
                <select
                  id="cp-methodology"
                  className="form-select"
                  name="methodology"
                  value={form.methodology}
                  onChange={handleChange}
                >
                  {Object.entries(MethodologyType).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── Timeline ── */}
          <section className="form-section">
            <h2 className="form-section-title">
              <i className="bi bi-calendar3" />
              Timeline
            </h2>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="cp-start">
                  Start Date
                </label>
                <input
                  id="cp-start"
                  className="form-control"
                  type="date"
                  name="startDateUtc"
                  value={form.startDateUtc}
                  onChange={handleChange}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="cp-end">
                  End Date
                </label>
                <input
                  id="cp-end"
                  className="form-control"
                  type="date"
                  name="endDateUtc"
                  value={form.endDateUtc}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* ── Details ── */}
          <section className="form-section">
            <h2 className="form-section-title">
              <i className="bi bi-card-text" />
              Project Details
            </h2>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="cp-objectives">
                  Objectives
                </label>
                <textarea
                  id="cp-objectives"
                  className="form-control"
                  name="objectives"
                  value={form.objectives}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What are the project goals?"
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="cp-scope">
                  Scope
                </label>
                <textarea
                  id="cp-scope"
                  className="form-control"
                  name="scope"
                  value={form.scope}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Define the project boundaries"
                />
              </div>
            </div>
          </section>

          {/* ── Actions ── */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline-secondary btn-lg"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-info text-white btn-lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProject;
