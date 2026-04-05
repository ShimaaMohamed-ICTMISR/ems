interface AccessDeniedStateProps {
  title?: string;
  description?: string;
}

export function AccessDeniedState({
  title = 'Access restricted',
  description = 'You do not have permission to access this section. Please contact your administrator if this should be available to your role.',
}: AccessDeniedStateProps) {
  return (
    <section className="d-flex justify-content-center align-items-center py-4 px-2">
      <article
        className="w-100 border"
        style={{
          maxWidth: '760px',
          borderRadius: '16px',
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(245,251,255,0.98))',
          borderColor: '#dbe7f5',
          boxShadow: '0 14px 30px rgba(15, 23, 42, 0.08)',
          padding: '1.25rem',
        }}
      >
        <div className="d-flex flex-column flex-md-row align-items-start gap-3">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: '52px',
              height: '52px',
              background: 'rgba(245, 158, 11, 0.16)',
              color: '#b45309',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-shield-lock fs-4" />
          </div>
          <div>
            <h2
              className="h5 mb-2"
              style={{
                color: '#0f172a',
              }}
            >
              {title}
            </h2>
            <p className="mb-0" style={{ color: '#475569', lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

export default AccessDeniedState;
