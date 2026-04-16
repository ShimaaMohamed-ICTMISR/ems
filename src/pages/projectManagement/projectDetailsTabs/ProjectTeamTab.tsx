import type { Dispatch, SetStateAction } from "react";
import { AccessDeniedState } from "../../../Components/AccessDeniedState";
import type { Employee } from "../../../services/hrProjectManagementService";
import type { ProjectMember } from "../../../services/projectManagementServices/memberService";

type ProjectTeamTabProps = {
  canCreateTeamMembers: boolean;
  showAddMember: boolean;
  setShowAddMember: Dispatch<SetStateAction<boolean>>;
  employeeSearch: string;
  setEmployeeSearch: Dispatch<SetStateAction<string>>;
  filteredAvailableEmployees: Employee[];
  addingMember: boolean;
  handleAddMemberFromEmployee: (employee: Employee) => void;
  canViewTeamMembers: boolean;
  membersLoading: boolean;
  projectMembers: ProjectMember[];
  employees: Employee[];
  resolveEmployeeUserId: (employee: Employee) => string;
  canEditTeamMembers: boolean;
  canDeleteTeamMembers: boolean;
  setEditingMemberId: Dispatch<SetStateAction<string | null>>;
  setEditMemberRole: Dispatch<SetStateAction<string>>;
  handleDeleteMember: (member: ProjectMember) => void;
  editingMemberId: string | null;
  editMemberRole: string;
  handleUpdateMemberRole: (member: ProjectMember) => void;
};

export function ProjectTeamTab({
  canCreateTeamMembers,
  showAddMember,
  setShowAddMember,
  employeeSearch,
  setEmployeeSearch,
  filteredAvailableEmployees,
  addingMember,
  handleAddMemberFromEmployee,
  canViewTeamMembers,
  membersLoading,
  projectMembers,
  employees,
  resolveEmployeeUserId,
  canEditTeamMembers,
  canDeleteTeamMembers,
  setEditingMemberId,
  setEditMemberRole,
  handleDeleteMember,
  editingMemberId,
  editMemberRole,
  handleUpdateMemberRole,
}: ProjectTeamTabProps) {
  return (
    <section className="members-section">
      <div className="members-section-header">
        <h2>
          <i className="bi bi-people-fill me-2" />
          Team Members
        </h2>
        {canCreateTeamMembers && (
          <button
            type="button"
            className="btn btn-info text-white btn-sm"
            onClick={() => setShowAddMember((prev) => !prev)}
          >
            <i
              className={`bi ${showAddMember ? "bi-x-circle" : "bi-person-plus"} me-1`}
            />
            {showAddMember ? "Close" : "Add Member"}
          </button>
        )}
      </div>

      {canCreateTeamMembers && showAddMember && (
        <div className="member-add-card">
          <h3 className="h6 mb-3">Add HR Employee to Project</h3>
          <input
            className="form-control form-control-sm mb-3"
            placeholder="Search employees by name or email..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
          />
          <div className="member-add-list">
            {filteredAvailableEmployees.length === 0 ? (
              <div className="member-add-empty">
                <i className="bi bi-people" />
                <span>No available employees found.</span>
              </div>
            ) : (
              filteredAvailableEmployees.map((emp) => (
                <div key={emp.id} className="member-add-item">
                  <div className="member-add-avatar">
                    {emp.firstName.charAt(0)}
                    {emp.lastName.charAt(0)}
                  </div>
                  <div className="member-add-info">
                    <span className="member-add-name">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="member-add-meta">
                      {emp.position?.title || "No position"} ·{" "}
                      {emp.department?.name || "No dept"}
                      {emp.email ? ` · ${emp.email}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    disabled={addingMember}
                    onClick={() => handleAddMemberFromEmployee(emp)}
                  >
                    <i className="bi bi-plus-lg me-1" />
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!canViewTeamMembers ? (
        <AccessDeniedState
          title="Team members are restricted"
          description="You can access this tab, but your role does not include Admin.Members.View to view the members list."
        />
      ) : membersLoading ? (
        <div className="text-center py-4">
          <div
            className="spinner-border spinner-border-sm text-info"
            role="status"
          />
        </div>
      ) : projectMembers.length === 0 ? (
        <div className="members-empty">
          <i className="bi bi-person-x" />
          <p className="mb-0">
            No members yet. Click "Add Member" to add HR employees to this
            project.
          </p>
        </div>
      ) : (
        <div className="members-grid">
          {projectMembers.map((member) => {
            const emp = employees.find(
              (e) => resolveEmployeeUserId(e) === member.userId,
            );
            const initials = member.fullName
              .split(" ")
              .map((n) => n.charAt(0))
              .join("")
              .slice(0, 2);
            return (
              <div key={member.id} className="member-card">
                <div className="member-card-header">
                  <div className="member-card-avatar">{initials}</div>
                  {(canEditTeamMembers || canDeleteTeamMembers) && (
                    <div className="member-card-actions">
                      {canEditTeamMembers && (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          title="Edit Role"
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setEditMemberRole(member.role);
                          }}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                      )}
                      {canDeleteTeamMembers && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          title="Remove Member"
                          onClick={() => handleDeleteMember(member)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="member-card-body">
                  <h4 className="member-card-name">{member.fullName}</h4>
                  {editingMemberId === member.id ? (
                    <div className="member-card-edit-role">
                      <input
                        className="form-control form-control-sm"
                        value={editMemberRole}
                        onChange={(e) => setEditMemberRole(e.target.value)}
                        placeholder="Role"
                      />
                      <div className="member-card-edit-actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleUpdateMemberRole(member)}
                        >
                          <i className="bi bi-check" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingMemberId(null)}
                        >
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="member-card-role">{member.role}</span>
                  )}
                  {emp && (
                    <span className="member-card-dept">
                      {emp.department?.name || "No dept"}{" "}
                      {emp.email ? `· ${emp.email}` : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
