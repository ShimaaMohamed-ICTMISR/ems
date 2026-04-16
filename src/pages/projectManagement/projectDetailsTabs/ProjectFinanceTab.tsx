import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AccessDeniedState } from "../../../Components/AccessDeniedState";
import { BudgetCategory } from "../../../config/enums";
import type { Budget } from "../../../services/projectManagementServices/financeService";

type BudgetFormState = {
  category: string;
  plannedAmount: string;
  actualAmount: string;
  forecastAmount: string;
};

type BudgetChartDatum = {
  category: string;
  planned: number;
  actual: number;
  forecast: number;
};

type BudgetDistributionDatum = {
  name: string;
  value: number;
};

type BudgetConsumptionDatum = {
  id: string;
  category: string;
  planned: number;
  actual: number;
  percent: number;
};

type ProjectFinanceTabProps = {
  canCreateBudgets: boolean;
  showCreateBudget: boolean;
  setShowCreateBudget: Dispatch<SetStateAction<boolean>>;
  availableBudgetCategoryEntries: [string, string][];
  canViewBudgets: boolean;
  handleCreateBudget: (event: FormEvent<HTMLFormElement>) => void;
  newBudget: BudgetFormState;
  handleNewBudgetChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  creatingBudget: boolean;
  budgetsLoading: boolean;
  budgets: Budget[];
  budgetChartData: BudgetChartDatum[];
  budgetDistributionData: BudgetDistributionDatum[];
  chartPalette: string[];
  currencyFormatter: Intl.NumberFormat;
  budgetConsumptionData: BudgetConsumptionDatum[];
  editingBudgetId: string | null;
  canEditBudgets: boolean;
  editBudgetForm: BudgetFormState;
  handleEditBudgetChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleUpdateBudget: (budget: Budget) => void;
  setEditingBudgetId: Dispatch<SetStateAction<string | null>>;
  canDeleteBudgets: boolean;
  confirmDeleteBudgetId: string | null;
  handleDeleteBudget: (budgetId: string) => void;
  setConfirmDeleteBudgetId: Dispatch<SetStateAction<string | null>>;
  startEditBudget: (budget: Budget) => void;
};

export function ProjectFinanceTab({
  canCreateBudgets,
  showCreateBudget,
  setShowCreateBudget,
  availableBudgetCategoryEntries,
  canViewBudgets,
  handleCreateBudget,
  newBudget,
  handleNewBudgetChange,
  creatingBudget,
  budgetsLoading,
  budgets,
  budgetChartData,
  budgetDistributionData,
  chartPalette,
  currencyFormatter,
  budgetConsumptionData,
  editingBudgetId,
  canEditBudgets,
  editBudgetForm,
  handleEditBudgetChange,
  handleUpdateBudget,
  setEditingBudgetId,
  canDeleteBudgets,
  confirmDeleteBudgetId,
  handleDeleteBudget,
  setConfirmDeleteBudgetId,
  startEditBudget,
}: ProjectFinanceTabProps) {
  return (
    <section className="tasks-section">
      <div className="tasks-section-header">
        <h2>
          <i className="bi bi-cash-coin me-2" />
          Finance
        </h2>
        {canCreateBudgets && (
          <button
            type="button"
            className="btn btn-info text-white btn-sm"
            onClick={() => setShowCreateBudget((prev) => !prev)}
            disabled={availableBudgetCategoryEntries.length === 0}
          >
            <i
              className={`bi ${showCreateBudget ? "bi-x-circle" : "bi-plus-lg"} me-1`}
            />
            {showCreateBudget ? "Cancel" : "New Budget"}
          </button>
        )}
      </div>

      {!canViewBudgets ? (
        <AccessDeniedState
          title="Finance budgets are restricted"
          description="You can access this tab, but your role does not include Finance.Budgets.View to display budget data."
        />
      ) : (
        <>
          {canCreateBudgets && showCreateBudget && (
            <div className="task-create-card">
              <h3 className="h6 mb-3">Create Budget</h3>
              {availableBudgetCategoryEntries.length === 0 ? (
                <div className="tasks-empty-message py-3">
                  All budget categories are already used in this project.
                </div>
              ) : (
                <form className="row g-3" onSubmit={handleCreateBudget}>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      name="category"
                      value={newBudget.category}
                      onChange={handleNewBudgetChange}
                      required
                    >
                      {availableBudgetCategoryEntries.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Planned Amount</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      name="plannedAmount"
                      value={newBudget.plannedAmount}
                      onChange={handleNewBudgetChange}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Actual Amount</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      name="actualAmount"
                      value={newBudget.actualAmount}
                      onChange={handleNewBudgetChange}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label">Forecast Amount</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      name="forecastAmount"
                      value={newBudget.forecastAmount}
                      onChange={handleNewBudgetChange}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={creatingBudget}
                    >
                      {creatingBudget ? "Creating..." : "Create Budget"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {budgetsLoading ? (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-info"
                role="status"
              />
            </div>
          ) : budgets.length === 0 ? (
            <div className="tasks-table-wrap">
              <div className="tasks-empty-message">
                <i className="bi bi-inbox" />
                No budgets yet. Click "New Budget" to add one.
              </div>
            </div>
          ) : (
            <>
              <div className="finance-charts-grid mb-3">
                <article className="details-card finance-chart-card">
                  <div className="finance-chart-header">
                    <h3 className="h6 mb-1">Budget vs Actual vs Forecast</h3>
                    <p className="mb-0">
                      Compare planned budget, current spending, and projected
                      final cost.
                    </p>
                  </div>
                  <div className="finance-chart-body">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={budgetChartData}
                        margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6eef5" />
                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) =>
                            currencyFormatter.format(Number(value ?? 0))
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="planned"
                          name="Planned"
                          fill="#1b4965"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="actual"
                          name="Actual"
                          fill="#ef8354"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="forecast"
                          name="Forecast"
                          fill="#189ab4"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="details-card finance-chart-card">
                  <div className="finance-chart-header">
                    <h3 className="h6 mb-1">Planned Budget Distribution</h3>
                    <p className="mb-0">
                      Allocation of planned budget across categories.
                    </p>
                  </div>
                  <div className="finance-chart-body">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={budgetDistributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={105}
                        >
                          {budgetDistributionData.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={chartPalette[index % chartPalette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            currencyFormatter.format(Number(value ?? 0))
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </div>

              <article className="details-card finance-consumption-card mb-3">
                <h3 className="h6 mb-3">Budget Consumption by Category</h3>
                <div className="finance-consumption-list">
                  {budgetConsumptionData.map((item) => {
                    const boundedPercent = Math.max(
                      0,
                      Math.min(item.percent, 100),
                    );
                    const overBudget = item.percent > 100;

                    return (
                      <div key={item.id} className="finance-consumption-item">
                        <div className="finance-consumption-top">
                          <span className="finance-consumption-name">
                            {item.category}
                          </span>
                          <span
                            className={`finance-consumption-percent ${
                              overBudget ? "over" : ""
                            }`}
                          >
                            {item.percent.toFixed(1)}%
                          </span>
                        </div>
                        <div
                          className="finance-consumption-track"
                          role="progressbar"
                        >
                          <span
                            className={`finance-consumption-fill ${
                              overBudget ? "over" : ""
                            }`}
                            style={{ width: `${boundedPercent}%` }}
                          />
                        </div>
                        <p className="finance-consumption-meta mb-0">
                          {currencyFormatter.format(item.actual)} of{" "}
                          {currencyFormatter.format(item.planned)} consumed
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>

              <div className="tasks-table-wrap">
                <table className="tasks-table budget-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Planned</th>
                      <th>Actual</th>
                      <th>Forecast</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((b) =>
                      editingBudgetId === b.id && canEditBudgets ? (
                        <tr key={b.id} className="phase-edit-row">
                          <td>
                            <select
                              className="form-select form-select-sm"
                              name="category"
                              value={editBudgetForm.category}
                              onChange={handleEditBudgetChange}
                            >
                              {Object.entries(BudgetCategory).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              name="plannedAmount"
                              value={editBudgetForm.plannedAmount}
                              onChange={handleEditBudgetChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              name="actualAmount"
                              value={editBudgetForm.actualAmount}
                              onChange={handleEditBudgetChange}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              name="forecastAmount"
                              value={editBudgetForm.forecastAmount}
                              onChange={handleEditBudgetChange}
                            />
                          </td>
                          <td>
                            <div className="task-row-actions">
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => handleUpdateBudget(b)}
                                title="Save"
                              >
                                <i className="bi bi-check-lg" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setEditingBudgetId(null)}
                                title="Cancel"
                              >
                                <i className="bi bi-x-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={b.id}>
                          <td>
                            {BudgetCategory[b.category ?? 0] || "Unknown"}
                          </td>
                          <td>${(b.plannedAmount ?? 0).toLocaleString()}</td>
                          <td>${(b.actualAmount ?? 0).toLocaleString()}</td>
                          <td>${(b.forecastAmount ?? 0).toLocaleString()}</td>
                          <td>
                            <div className="task-row-actions">
                              {canDeleteBudgets &&
                                (confirmDeleteBudgetId === b.id ? (
                                  <span className="confirm-inline confirm-inline-sm">
                                    <span className="confirm-inline-text">
                                      Delete?
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDeleteBudget(b.id)}
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() =>
                                        setConfirmDeleteBudgetId(null)
                                      }
                                    >
                                      No
                                    </button>
                                  </span>
                                ) : null)}

                              {confirmDeleteBudgetId !== b.id && (
                                <>
                                  {canEditBudgets && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => startEditBudget(b)}
                                      title="Edit"
                                    >
                                      <i className="bi bi-pencil" />
                                    </button>
                                  )}
                                  {canDeleteBudgets && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() =>
                                        setConfirmDeleteBudgetId(b.id)
                                      }
                                      title="Delete"
                                    >
                                      <i className="bi bi-trash" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
