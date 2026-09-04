import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import ProfileMenu from "./ProfileMenu";
import DayGigLogo from "./DayGigLogo";

function salaryLabel(salary, fallback = "-") {
  return salary == null ? fallback : `\u20b9${salary}`;
}

function getContactNumber(job) {
  return String(job?.contact || job?.sender_phone || "").replace(/\D/g, "");
}

function getIndiaPhoneNumber(job) {
  const digits = getContactNumber(job);

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

function getSalaryText(job) {
  if (job.salary == null) return job.title || "-";
  const type = job.salary_type ? `/${job.salary_type}` : "";
  return `\u20b9${job.salary}${type}`;
}

function getGoogleMapsUrl(job) {
  const lat = job?.coordinates?.lat;
  const lng = job?.coordinates?.lng;

  if (lat == null || lng == null) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function createSalaryIcon(job, isSelected) {
  // When no salary, show the job title (truncated to keep marker compact)
  const label =
    job.salary != null
      ? `\u20b9${job.salary}`
      : job.title
      ? job.title.length > 12
        ? job.title.slice(0, 11) + "\u2026"
        : job.title
      : "-";

  // Wider box for title-based labels
  const width  = job.salary != null ? 74 : Math.max(74, label.length * 8 + 24);
  const height = 38;

  return L.divIcon({
    className: `salary-marker-shell${isSelected ? " selected" : ""}`,
    html: `<span class="salary-marker">${label}</span>`,
    iconSize:   [width,      height],
    iconAnchor: [width / 2,  height / 2],
  });
}

function FlyTo({ selectedJob }) {
  const map = useMap();

  useEffect(() => {
    if (selectedJob?.coordinates) {
      map.flyTo(
        [selectedJob.coordinates.lat, selectedJob.coordinates.lng],
        14,
        { duration: 0.8 }
      );
    }
  }, [map, selectedJob]);

  return null;
}

/* ── User location dot icon ─────────────────────────────────────────── */
const USER_DOT_ICON = L.divIcon({
  className: "",
  html: `<div class="user-location-dot"><div class="user-location-pulse"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function JobCard({ job, className = "", onSelect }) {
  const contactNumber = getContactNumber(job);
  const whatsappNumber = getIndiaPhoneNumber(job);
  const googleMapsUrl = getGoogleMapsUrl(job);

  return (
    <article
      className={`job-info-card ${className}`}
      onClick={onSelect ? () => onSelect(job) : undefined}
    >
      <a
        className={`job-map-link${googleMapsUrl ? "" : " disabled"}`}
        href={googleMapsUrl || undefined}
        target="_blank"
        rel="noreferrer"
        aria-label="Open job location in Google Maps"
        aria-disabled={!googleMapsUrl}
        onClick={(event) => event.stopPropagation()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </a>

      <div className="job-info-main">
        <p className="job-info-pay">{getSalaryText(job)}</p>
        <h2>{job.title}</h2>
        <p>{job.location_text || "Location on map"}</p>
        <p>{job.work_time || "Timing not mentioned"}</p>
        {job.description && (
          <p className="job-info-description">{job.description}</p>
        )}
      </div>

      <div className="job-info-actions">
        <a
          className={`job-action whatsapp${whatsappNumber ? "" : " disabled"}`}
          href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!whatsappNumber}
          onClick={(event) => event.stopPropagation()}
        >
          WhatsApp
        </a>
        <a
          className={`job-action call${contactNumber ? "" : " disabled"}`}
          href={contactNumber ? `tel:${contactNumber}` : undefined}
          aria-disabled={!contactNumber}
          onClick={(event) => event.stopPropagation()}
        >
          Call
        </a>
      </div>
    </article>
  );
}

const SORT_OPTIONS = [
  { id: "default",      label: "Default"  },
  { id: "salary-desc",  label: "Salary ↓" },
  { id: "salary-asc",   label: "Salary ↑" },
];

const TYPE_OPTIONS = [
  { id: "all",   label: "All"   },
  { id: "day",   label: "Day"   },
  { id: "hour",  label: "Hour"  },
  { id: "month", label: "Month" },
];

export default function MapView({ jobs, userLocation, selectedJob, onSelect }) {
  const { isLoggedIn } = useAuth();
  const mapRef = useRef(null);
  const [locating,      setLocating]      = useState(false);
  const [userPos,       setUserPos]       = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen,  setIsFilterOpen]  = useState(false);
  const [sortBy,        setSortBy]        = useState("default");
  const [filterType,    setFilterType]    = useState("all");
  const [minSalary,     setMinSalary]     = useState("");

  /* ── Locate handler ── */
  const handleLocate = useCallback(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(latlng);
        mapRef.current?.flyTo(latlng, 16, { duration: 1 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const center        = userLocation || { lat: 9.9312, lng: 76.2673 };
  const selectedJobId = selectedJob?.message_id;

  const activeJobs = jobs.filter(
    (job) => job.coordinates?.lat && job.coordinates?.lng
  );

  // ── Filter ──────────────────────────────────────────────────────────
  const hasActiveFilter =
    sortBy !== "default" || filterType !== "all" || minSalary !== "";

  let displayJobs = [...activeJobs];

  if (filterType !== "all") {
    displayJobs = displayJobs.filter(
      (job) => (job.salary_type || "").toLowerCase() === filterType
    );
  }

  if (minSalary !== "" && !isNaN(Number(minSalary))) {
    displayJobs = displayJobs.filter(
      (job) => job.salary != null && Number(job.salary) >= Number(minSalary)
    );
  }

  // ── Sort ────────────────────────────────────────────────────────────
  if (sortBy === "salary-desc") {
    displayJobs.sort((a, b) => (b.salary ?? -1) - (a.salary ?? -1));
  } else if (sortBy === "salary-asc") {
    displayJobs.sort((a, b) => (a.salary ?? Infinity) - (b.salary ?? Infinity));
  }

  function clearFilters() {
    setSortBy("default");
    setFilterType("all");
    setMinSalary("");
  }

  return (
    <section className="map-shell">
      <button
        className="nearby-jobs-toggle"
        type="button"
        aria-label="Show nearby jobs"
        aria-expanded={isSidebarOpen}
        onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* DayGig brand badge — top center */}
      <div className="map-brand-badge" aria-label="DayGig">
        <DayGigLogo size={22} />
      </div>

      {/* ── Locate-me button — direct child of map-shell so absolute positioning works —─ */}
      <button
        id="locate-me-btn"
        className={`locate-me-btn${locating ? " locating" : ""}`}
        type="button"
        aria-label="Go to my location"
        onClick={handleLocate}
        disabled={locating}
      >
        {locating ? (
          <span className="locate-spinner" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        )}
      </button>

      {isLoggedIn && <ProfileMenu />}

      <aside className={`nearby-jobs-sidebar${isSidebarOpen ? " open" : ""}`}>
        {/* ── Header ── */}
        <div className="nearby-jobs-header">
          <div>
            <h2>Nearby jobs</h2>
            <p>
              {displayJobs.length}
              {displayJobs.length !== activeJobs.length
                ? ` of ${activeJobs.length}`
                : ""}{" "}
              jobs found
            </p>
          </div>
          <button
            className="nearby-jobs-close"
            type="button"
            aria-label="Close nearby jobs"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Filter / Sort bar ── */}
        <div className="sidebar-filter-bar">
          <button
            id="sidebar-filter-toggle"
            className={`sidebar-filter-toggle${isFilterOpen ? " open" : ""}${hasActiveFilter ? " active" : ""}`}
            type="button"
            onClick={() => setIsFilterOpen((v) => !v)}
            aria-expanded={isFilterOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4"  y1="6"  x2="20" y2="6"  />
              <line x1="4"  y1="12" x2="20" y2="12" />
              <line x1="4"  y1="18" x2="20" y2="18" />
              <circle cx="8"  cy="6"  r="2" fill="currentColor" stroke="none" />
              <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
            </svg>
            <span>Filter &amp; Sort</span>
            {hasActiveFilter && (
              <span className="sidebar-filter-dot" aria-label="filters active" />
            )}
            <svg
              className="sidebar-filter-chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {isFilterOpen && (
            <div className="sidebar-filter-panel">
              {/* Sort */}
              <div className="sfp-section">
                <p className="sfp-label">Sort by</p>
                <div className="sfp-pills" role="group" aria-label="Sort options">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      id={`sort-${opt.id}`}
                      className={`sfp-pill${sortBy === opt.id ? " selected" : ""}`}
                      type="button"
                      onClick={() => setSortBy(opt.id)}
                      aria-pressed={sortBy === opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay type */}
              <div className="sfp-section">
                <p className="sfp-label">Pay type</p>
                <div className="sfp-pills" role="group" aria-label="Pay type filter">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      id={`type-${opt.id}`}
                      className={`sfp-pill${filterType === opt.id ? " selected" : ""}`}
                      type="button"
                      onClick={() => setFilterType(opt.id)}
                      aria-pressed={filterType === opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min salary */}
              <div className="sfp-section">
                <label className="sfp-label" htmlFor="sfp-min-salary">
                  Min salary (₹)
                </label>
                <input
                  id="sfp-min-salary"
                  className="sfp-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                />
              </div>

              {/* Clear */}
              {hasActiveFilter && (
                <button
                  id="sfp-clear-btn"
                  className="sfp-clear"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Job list ── */}
        <div className="nearby-jobs-list">
          {displayJobs.length === 0 ? (
            <p className="nearby-jobs-empty">
              {hasActiveFilter
                ? "No jobs match your filters."
                : "No nearby jobs found."}
            </p>
          ) : (
            displayJobs.map((job) => (
              <JobCard
                key={job.message_id}
                job={job}
                className={`sidebar-job-card${
                  selectedJobId === job.message_id ? " selected" : ""
                }`}
                onSelect={(selected) => {
                  onSelect(selected);
                  setIsSidebarOpen(false);
                }}
              />
            ))
          )}
        </div>
      </aside>

      <MapContainer
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        className="job-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeJobs.map((job) => (
          <Marker
            key={job.message_id}
            position={[job.coordinates.lat, job.coordinates.lng]}
            icon={createSalaryIcon(job, selectedJobId === job.message_id)}
            eventHandlers={{ click: () => onSelect(job) }}
          />
        ))}

        {userPos && <Marker position={userPos} icon={USER_DOT_ICON} />}
        <FlyTo selectedJob={selectedJob} />
      </MapContainer>

      {selectedJob && (
        <JobCard job={selectedJob} className="job-info-panel" />
      )}
    </section>
  );
}
