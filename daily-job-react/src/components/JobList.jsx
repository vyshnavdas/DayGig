export default function JobList({ jobs, loading, selectedJob, onSelect }) {
  const formatSalary = (salary) => (salary == null ? "-" : `\u20b9${salary}/day`);

  return (
    <aside
      style={{
        width: "350px",
        height: "100vh",
        overflowY: "auto",
        background: "#f7f7f5",
        borderRight: "1px solid #ddd",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        textAlign: "left",
      }}
    >
      <div
        style={{
          padding: "18px 18px 16px",
          background: "#111",
          color: "white",
          fontWeight: "800",
          fontSize: "18px",
          letterSpacing: 0,
        }}
      >
        Nearby Jobs
      </div>

      {loading && (
        <div style={{ padding: "16px", color: "#777" }}>Loading jobs...</div>
      )}

      {!loading && jobs.length === 0 && (
        <div style={{ padding: "16px", color: "#777" }}>No active jobs found.</div>
      )}

      {jobs.map((job) => {
        const isSelected = selectedJob?.message_id === job.message_id;

        return (
          <button
            key={job.message_id}
            onClick={() => onSelect(job)}
            style={{
              display: "block",
              width: "100%",
              padding: "15px 16px",
              border: 0,
              borderBottom: "1px solid #e8e8e8",
              borderLeft: isSelected ? "4px solid #111" : "4px solid transparent",
              background: isSelected ? "#fff" : "transparent",
              color: "#111",
              cursor: "pointer",
              font: "inherit",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: "800", fontSize: "15px", marginBottom: "6px" }}>
              {job.title}
            </div>
            <div style={{ color: "#666", fontSize: "13px", marginBottom: "3px" }}>
              {job.location_text || "Location on map"}
            </div>
            <div style={{ color: "#666", fontSize: "13px", marginBottom: "3px" }}>
              {job.work_time || "Timing not mentioned"}
            </div>
            <div style={{ color: "#111", fontSize: "14px", fontWeight: "800" }}>
              {formatSalary(job.salary)}
            </div>
            {job.gender_requirement && (
              <div style={{ color: "#888", fontSize: "12px", marginTop: "3px" }}>
                {job.gender_requirement}
              </div>
            )}
          </button>
        );
      })}
    </aside>
  );
}
