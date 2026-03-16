import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import projectService, { type Project } from "../services/projectService";
import documentService, {
  type ProjectDocument,
  type DocumentCreateDTO,
  type DocumentUpdateDTO,
} from "../services/documentService";
import { DocumentType } from "../config/enums";
import type { RootState } from "../store/store";
import "./styles/ProjectDocuments.css";

type CreateDocumentFormState = {
  name: string;
  type: string;
  version: string;
};

type EditDocumentFormState = {
  name: string;
  type: string;
  filePath: string;
  version: string;
};

const initialCreateForm: CreateDocumentFormState = {
  name: "",
  type: "0",
  version: "1",
};

const initialEditForm: EditDocumentFormState = {
  name: "",
  type: "0",
  filePath: "",
  version: "1",
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toSlugName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-");
}

function inferDocumentPath(projectId: string, file: File): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const normalizedFile = toSlugName(file.name || "document");
  return `documents/${projectId}/${timestamp}-${normalizedFile}`;
}

function parseApiUtcDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatApiDateTime(value?: string | null): string {
  const parsed = parseApiUtcDate(value);
  return parsed ? parsed.toLocaleString() : "N/A";
}

function trimExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0) return fileName;
  return fileName.slice(0, lastDot);
}

export function ProjectDocuments() {
  const navigate = useNavigate();
  const { portfolioId, projectId } = useParams();
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] =
    useState<CreateDocumentFormState>(initialCreateForm);
  const [selectedCreateFile, setSelectedCreateFile] = useState<File | null>(
    null,
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] =
    useState<EditDocumentFormState>(initialEditForm);
  const [selectedEditFile, setSelectedEditFile] = useState<File | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  console.log("Document List:", documents);

  useEffect(() => {
    async function load() {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [projectData, docsData] = await Promise.all([
          projectService.getProjectById(projectId),
          documentService.getDocuments(projectId),
        ]);
        setProject(projectData);
        setDocuments(docsData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load project documents.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId]);

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (a, b) =>
          (parseApiUtcDate(b.updatedDateUtc || b.createdDateUtc)?.getTime() ||
            0) -
          (parseApiUtcDate(a.updatedDateUtc || a.createdDateUtc)?.getTime() ||
            0),
      ),
    [documents],
  );

  function handleCreateChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCreateFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedCreateFile(file);

    if (!file) {
      return;
    }

    setCreateForm((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : trimExtension(file.name),
    }));
  }

  function handleEditChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedEditFile(file);

    if (!file) {
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : trimExtension(file.name),
    }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;

    if (!createForm.name.trim()) {
      toast.error("Document name is required.");
      return;
    }

    if (!selectedCreateFile) {
      toast.error("Please choose a file first.");
      return;
    }

    try {
      setCreating(true);
      const uploadedBy =
        authUser?.fullName ||
        authUser?.username ||
        authUser?.email ||
        "Unknown User";
      const uploadedAtUtc = new Date().toISOString();
      const payload: DocumentCreateDTO = {
        projectId,
        name: createForm.name.trim(),
        type: parseInt(createForm.type, 10),
        filePath: inferDocumentPath(projectId, selectedCreateFile),
        version: parseInt(createForm.version, 10) || 1,
        uploadedBy,
        uploadedAtUtc,
      };

      await documentService.createDocument(payload);
      toast.success("Document added successfully.");
      setCreateForm(initialCreateForm);
      setSelectedCreateFile(null);
      setShowCreate(false);
      const refreshed = await documentService.getDocuments(projectId);
      setDocuments(refreshed);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add document.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(doc: ProjectDocument) {
    setEditingId(doc.id);
    setSelectedEditFile(null);
    setEditForm({
      name: doc.name || "",
      type: String(doc.type ?? 0),
      filePath: doc.filePath || "",
      version: String(doc.version ?? 1),
    });
  }

  async function handleUpdate(doc: ProjectDocument) {
    if (!projectId) return;

    if (!editForm.name.trim()) {
      toast.error("Document name is required.");
      return;
    }

    try {
      const latest = await documentService.getDocumentById(doc.id);
      const replacingFile = Boolean(selectedEditFile);
      const resolvedFilePath = selectedEditFile
        ? inferDocumentPath(projectId, selectedEditFile)
        : editForm.filePath.trim();

      if (!resolvedFilePath) {
        toast.error("Please choose a file.");
        return;
      }

      const payload: DocumentUpdateDTO = {
        id: doc.id,
        projectId,
        rowVersion: latest.rowVersion || doc.rowVersion || "",
        name: editForm.name.trim(),
        type: parseInt(editForm.type, 10),
        filePath: resolvedFilePath,
        version: parseInt(editForm.version, 10) || 1,
        uploadedBy: replacingFile
          ? authUser?.fullName ||
            authUser?.username ||
            authUser?.email ||
            "Unknown User"
          : latest.uploadedBy || doc.uploadedBy || undefined,
        uploadedAtUtc: replacingFile
          ? new Date().toISOString()
          : latest.uploadedAtUtc || doc.uploadedAtUtc || undefined,
      };

      await documentService.updateDocumentById(doc.id, payload);
      toast.success("Document updated.");
      setEditingId(null);
      setSelectedEditFile(null);
      const refreshed = await documentService.getDocuments(projectId);
      setDocuments(refreshed);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update document.");
    }
  }

  async function handleDelete(id: string) {
    if (!projectId) return;

    try {
      await documentService.deleteDocumentById(id);
      toast.success("Document deleted.");
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document.");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="project-documents-loading d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-info" role="status" />
          <p className="mt-3 mb-0">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-documents-page">
      <section className="project-documents-hero mb-4">
        <div>
          <p className="project-documents-kicker mb-2">Project Assets</p>
          <h1 className="project-documents-title mb-2">Documents</h1>
          <p className="project-documents-subtitle mb-0">
            {project?.name || "Project"} - manage plans, contracts, reports, and
            references.
          </p>
        </div>

        <div className="project-documents-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => setShowCreate((prev) => !prev)}
          >
            <i
              className={`bi ${showCreate ? "bi-x-circle" : "bi-plus-lg"} me-2`}
            />
            {showCreate ? "Close Form" : "New Document"}
          </button>
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() =>
              navigate(
                `/portfolios/${portfolioId || project?.portfolioId || ""}/projects/${projectId}`,
              )
            }
          >
            <i className="bi bi-arrow-left me-2" />
            Back to Project
          </button>
        </div>
      </section>

      {showCreate && (
        <section className="project-document-form-card mb-4">
          <h2 className="h6 mb-3">Add Document</h2>
          <form className="row g-3" onSubmit={handleCreate}>
            <div className="col-12 col-lg-6">
              <label className="form-label">Document Name *</label>
              <input
                className="form-control"
                name="name"
                value={createForm.name}
                onChange={handleCreateChange}
                maxLength={200}
                required
              />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Type *</label>
              <select
                className="form-select"
                name="type"
                value={createForm.type}
                onChange={handleCreateChange}
                required
              >
                {Object.entries(DocumentType).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Version</label>
              <input
                className="form-control"
                type="number"
                min={1}
                name="version"
                value={createForm.version}
                onChange={handleCreateChange}
              />
            </div>
            <div className="col-12 col-lg-8">
              <label className="form-label">Choose File *</label>
              <input
                className="form-control"
                type="file"
                onChange={handleCreateFileChange}
                required
              />
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Uploaded By</label>
              <input
                className="form-control"
                value={
                  authUser?.fullName ||
                  authUser?.username ||
                  authUser?.email ||
                  "Current User"
                }
                disabled
                readOnly
              />
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Uploaded At</label>
              <input
                className="form-control"
                value={new Date().toLocaleString()}
                disabled
                readOnly
              />
            </div>
            {selectedCreateFile && (
              <div className="col-12">
                <div className="project-document-picked-file">
                  <i className="bi bi-file-earmark-arrow-up me-2" />
                  <strong>{selectedCreateFile.name}</strong>
                  <span>
                    {(selectedCreateFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            )}
            <div className="col-12 d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-success"
                disabled={creating}
              >
                {creating ? "Saving..." : "Create Document"}
              </button>
            </div>
          </form>
        </section>
      )}

      {sortedDocuments.length === 0 ? (
        <section className="project-documents-empty">
          <i className="bi bi-folder2-open" />
          <h2 className="h6 mt-2">No documents yet</h2>
          <p className="mb-0">
            Start by adding your first document for this project.
          </p>
        </section>
      ) : (
        <section className="project-documents-grid">
          {sortedDocuments.map((doc) =>
            editingId === doc.id ? (
              <article
                key={doc.id}
                className="project-document-card project-document-card-editing"
              >
                <h3 className="h6 mb-3">Edit Document</h3>
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label">Name *</label>
                    <input
                      className="form-control form-control-sm"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select form-select-sm"
                      name="type"
                      value={editForm.type}
                      onChange={handleEditChange}
                    >
                      {Object.entries(DocumentType).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Version</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      min={1}
                      name="version"
                      value={editForm.version}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Current File Path</label>
                    <div className="project-document-path">
                      {editForm.filePath || "N/A"}
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      Replace File (Optional)
                    </label>
                    <input
                      className="form-control form-control-sm"
                      type="file"
                      onChange={handleEditFileChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Uploaded By</label>
                    <input
                      className="form-control form-control-sm"
                      value={
                        selectedEditFile
                          ? authUser?.fullName ||
                            authUser?.username ||
                            authUser?.email ||
                            "Current User"
                          : doc.uploadedBy || "N/A"
                      }
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Uploaded At</label>
                    <input
                      className="form-control form-control-sm"
                      value={
                        selectedEditFile
                          ? new Date().toLocaleString()
                          : formatApiDateTime(doc.uploadedAtUtc)
                      }
                      readOnly
                      disabled
                    />
                  </div>
                  {selectedEditFile && (
                    <div className="col-12">
                      <div className="project-document-picked-file">
                        <i className="bi bi-file-earmark-arrow-up me-2" />
                        <strong>{selectedEditFile.name}</strong>
                        <span>
                          {(selectedEditFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="project-document-actions mt-3">
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => handleUpdate(doc)}
                  >
                    <i className="bi bi-check2 me-1" />
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setEditingId(null);
                      setSelectedEditFile(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </article>
            ) : (
              <article key={doc.id} className="project-document-card">
                <div className="project-document-head">
                  <h3 className="project-document-title">
                    {doc.name || "Untitled document"}
                  </h3>
                  <span className="project-document-type">
                    {DocumentType[doc.type ?? 5] || "Other"}
                  </span>
                </div>

                <div className="project-document-meta">
                  <div className="project-document-meta-item">
                    <span>Version</span>
                    <strong>v{doc.version ?? 1}</strong>
                  </div>
                  <div className="project-document-meta-item">
                    <span>Uploaded By</span>
                    <strong>{doc.uploadedBy || "N/A"}</strong>
                  </div>
                  <div className="project-document-meta-item">
                    <span>Uploaded At</span>
                    <strong>{formatApiDateTime(doc.uploadedAtUtc)}</strong>
                  </div>
                </div>

                <div className="project-document-link-wrap">
                  {doc.filePath && isHttpUrl(doc.filePath) ? (
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="project-document-link"
                    >
                      <i className="bi bi-link-45deg me-1" />
                      Open Document Link
                    </a>
                  ) : (
                    <div className="project-document-path">
                      {doc.filePath || "N/A"}
                    </div>
                  )}
                </div>

                <div className="project-document-actions">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => startEdit(doc)}
                  >
                    <i className="bi bi-pencil-square me-1" />
                    Edit
                  </button>

                  {confirmDeleteId === doc.id ? (
                    <span className="confirm-inline confirm-inline-sm">
                      <span className="confirm-inline-text">Delete?</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(doc.id)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => setConfirmDeleteId(doc.id)}
                    >
                      <i className="bi bi-trash me-1" />
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ),
          )}
        </section>
      )}
    </div>
  );
}

export default ProjectDocuments;
