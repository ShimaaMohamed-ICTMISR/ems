import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { OpportunityStageEntry } from '../types/opportunity.types';
import {
  defaultStageEntryFormValues,
  entryToFormValues,
  formValuesToCreateBody,
  formValuesToPatchBody,
  type StageEntryFormValues,
} from '../utils/stageEntryPayload';

const stageEntrySchema = z
  .object({
    meetingAt: z.string(),
    people: z.string(),
    feedback: z.string(),
    nextStep: z.string(),
    documentUrl: z.string(),
    documentName: z.string(),
    actions: z.string(),
    notes: z.string(),
    sortOrder: z.number().int().min(0),
  })
  .superRefine((data, ctx) => {
    if (!Number.isFinite(data.sortOrder) || Number.isNaN(data.sortOrder)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sort order must be a number ≥ 0',
        path: ['sortOrder'],
      });
    }
    const m = data.meetingAt.trim();
    if (m && Number.isNaN(new Date(m).getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid meeting date/time',
        path: ['meetingAt'],
      });
    }
    const u = data.documentUrl.trim();
    if (u) {
      try {
        const parsed = new URL(u);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Document URL must start with http:// or https://',
            path: ['documentUrl'],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid document URL',
          path: ['documentUrl'],
        });
      }
    }
  });

type FormData = z.infer<typeof stageEntrySchema>;

export interface StageEntryFormProps {
  mode: 'create' | 'edit';
  entry?: OpportunityStageEntry;
  submitting: boolean;
  submitError: string | null;
  onSubmitCreate: (body: ReturnType<typeof formValuesToCreateBody>) => void | Promise<void>;
  onSubmitEdit: (entry: OpportunityStageEntry, patch: ReturnType<typeof formValuesToPatchBody>) => void | Promise<void>;
  onCancel: () => void;
}

export function StageEntryForm({
  mode,
  entry,
  submitting,
  submitError,
  onSubmitCreate,
  onSubmitEdit,
  onCancel,
}: StageEntryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(stageEntrySchema),
    defaultValues: defaultStageEntryFormValues(),
  });

  useEffect(() => {
    if (mode === 'edit' && entry) {
      reset(entryToFormValues(entry));
    } else {
      reset(defaultStageEntryFormValues());
    }
  }, [mode, entry, reset]);

  const onValid = async (data: FormData) => {
    const values: StageEntryFormValues = {
      meetingAt: data.meetingAt.trim(),
      people: data.people,
      feedback: data.feedback,
      nextStep: data.nextStep,
      documentUrl: data.documentUrl,
      documentName: data.documentName,
      actions: data.actions,
      notes: data.notes,
      sortOrder: data.sortOrder,
    };
    if (mode === 'create') {
      await onSubmitCreate(formValuesToCreateBody(values));
    } else if (entry) {
      const patch = formValuesToPatchBody(entry, values);
      if (Object.keys(patch).length === 0) {
        onCancel();
        return;
      }
      await onSubmitEdit(entry, patch);
    }
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      {submitError && (
        <div className="alert alert-danger py-2 small" role="alert">
          {submitError}
        </div>
      )}

      <p className="small text-muted mb-3">
        Upload files using your organization storage, then paste the public <strong>https</strong> URL in Document URL.
        This API stores the link only.
      </p>

      <div className="mb-3">
        <label className="form-label">Meeting date &amp; time</label>
        <input type="datetime-local" className="form-control" {...register('meetingAt')} />
        {errors.meetingAt && <div className="invalid-feedback d-block">{errors.meetingAt.message}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">People</label>
        <input type="text" className="form-control" {...register('people')} placeholder="Names or attendees" />
      </div>

      <div className="mb-3">
        <label className="form-label">Feedback</label>
        <textarea className="form-control" rows={2} {...register('feedback')} />
      </div>

      <div className="mb-3">
        <label className="form-label">Next step</label>
        <input type="text" className="form-control" {...register('nextStep')} />
      </div>

      <div className="mb-3">
        <label className="form-label">Document URL</label>
        <input
          type="url"
          className="form-control"
          {...register('documentUrl')}
          placeholder="https://..."
          autoComplete="off"
        />
        {errors.documentUrl && <div className="invalid-feedback d-block">{errors.documentUrl.message}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Document name</label>
        <input type="text" className="form-control" {...register('documentName')} placeholder="Optional label" />
      </div>

      <div className="mb-3">
        <label className="form-label">Optional file (name only)</label>
        <input
          type="file"
          className="form-control"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f?.name && !watch('documentName')?.trim()) {
              setValue('documentName', f.name, { shouldDirty: true });
            }
          }}
        />
        <div className="form-text">Does not upload — use Document URL after uploading elsewhere.</div>
      </div>

      <div className="mb-3">
        <label className="form-label">Actions</label>
        <textarea className="form-control" rows={2} {...register('actions')} />
      </div>

      <div className="mb-3">
        <label className="form-label">Notes</label>
        <textarea className="form-control" rows={3} {...register('notes')} />
      </div>

      <div className="mb-3">
        <label className="form-label">Sort order</label>
        <input
          type="number"
          className="form-control"
          min={0}
          step={1}
          {...register('sortOrder', { valueAsNumber: true })}
        />
        {errors.sortOrder && <div className="invalid-feedback d-block">{errors.sortOrder.message}</div>}
      </div>

      <div
        className="d-flex gap-2 justify-content-end pt-3 mt-2 border-top bg-body"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          marginInline: '-0.25rem',
          paddingInline: '0.25rem',
          paddingBottom: '0.25rem',
        }}
      >
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Add entry' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
