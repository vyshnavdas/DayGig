import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./PostJobPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

const GENDER_OPTIONS = ["Any", "Male", "Female"];
const SALARY_TYPES   = ["day", "hour", "month"];

/* ── Pin icon for the location picker ───────────────────────────────── */
const PIN_ICON = L.divIcon({
  className: "",
  html: `<div class="pjp-map-pin">
           <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z"/>
             <circle cx="12" cy="9" r="2.5" fill="#fff"/>
           </svg>
         </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

/* ── Map click handler ───────────────────────────────────────────────── */
function MapClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
}

/* ── Section wrapper ─────────────────────────────────────────────────── */
function Section({ icon, title, children }) {
  return (
    <div className="pjp-section">
      <div className="pjp-section-head">
        <span className="pjp-section-icon" aria-hidden="true">{icon}</span>
        <h2 className="pjp-section-title">{title}</h2>
      </div>
      <div className="pjp-section-body">{children}</div>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────────── */
function Field({ label, htmlFor, hint, required, children }) {
  return (
    <div className="pjp-field">
      <label className="pjp-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="pjp-required" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="pjp-hint">{hint}</p>}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════ */
export default function PostJobPage() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    title:              "",
    salary:             "",
    salary_type:        "day",
    workers_needed:     "",
    gender_requirement: "Any",
    age_requirement:    "",
    work_date:          "",
    work_time:          "",
    location_text:      "",
    contact:            "",
    description:        "",
    job_expire_time:    "",
  });

  const [coords,   setCoords]   = useState(null);   // { lat, lng }
  const [mapCenter, setMapCenter] = useState({ lat: 9.9312, lng: 76.2673 });
  const [locating, setLocating] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  /* ── Get user location for default map center ── */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  /* ── "Use my location" ── */
  function useMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(latlng);
        setMapCenter(latlng);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not get your location. Please click the map instead.");
      }
    );
  }

  /* ── Map click ── */
  const handleMapPick = useCallback((latlng) => {
    setCoords({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  /* ── Decode JWT expiry ── */
  function isTokenExpired(jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]));
      return Date.now() / 1000 >= payload.exp;
    } catch {
      return false;
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim())   { setError("Job title is required."); return; }
    if (!form.contact.trim()) { setError("Contact number is required."); return; }
    if (!coords)              { setError("Please pick a location on the map."); return; }

    if (!token) {
      setError("You are not logged in. Please log in and try again.");
      return;
    }
    if (isTokenExpired(token)) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    // Build payload — only include the fields the API expects
    const payload = {
      title:              form.title.trim(),
      salary:             form.salary ? Number(form.salary) : null,
      workers_needed:     form.workers_needed ? Number(form.workers_needed) : null,
      gender_requirement: form.gender_requirement,
      age_requirement:    form.age_requirement.trim() || null,
      work_date:          form.work_date || null,
      work_time:          form.work_time.trim() || null,
      location_text:      form.location_text.trim(),
      coordinates:        coords,
      contact:            form.contact.trim(),
      description:        form.description.trim() || null,
      job_expire_time:    form.job_expire_time ? new Date(form.job_expire_time).toISOString() : null,
    };

    setLoading(true);
    try {
      await axios.post(`${API_URL}/jobs/post`, payload, {
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      // Surface the real error — try every common Flask response shape
      const data   = err?.response?.data;
      const status = err?.response?.status;
      const msg =
        (typeof data === "string" ? data : null) ||
        data?.message ||
        data?.error ||
        data?.msg ||
        (status ? `Server error ${status}. Please try again.` : null) ||
        err?.message ||
        "Request failed. Please try again.";
      console.error("[PostJob] error:", status, data);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="pjp-success-shell">
        <div className="pjp-success-card">
          <div className="pjp-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Job Posted!</h2>
          <p>Your listing is live. Redirecting to the map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pjp-shell">
      {/* ── Top bar ── */}
      <header className="pjp-topbar">
        <button
          className="pjp-back-btn"
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="pjp-topbar-text">
          <h1 className="pjp-topbar-title">Post a Job</h1>
          <p className="pjp-topbar-sub">DayGig · Fill in the details below</p>
        </div>
      </header>

      {/* ── Form ── */}
      <form className="pjp-form" id="post-job-form" onSubmit={handleSubmit} noValidate>
        <div className="pjp-content">

          {/* ━━ Job Details ━━ */}
          <Section icon="📋" title="Job Details">
            <Field label="Job Title" htmlFor="pjp-title" required>
              <input
                id="pjp-title"
                className="pjp-input"
                type="text"
                placeholder="e.g. Mason, Painter, Construction Helper"
                value={form.title}
                onChange={set("title")}
                required
              />
            </Field>

            <Field label="Description" htmlFor="pjp-desc">
              <textarea
                id="pjp-desc"
                className="pjp-input pjp-textarea"
                placeholder="Describe the job, duties, skills needed…"
                rows={4}
                value={form.description}
                onChange={set("description")}
              />
            </Field>

            <div className="pjp-row">
              <Field label="Salary (₹)" htmlFor="pjp-salary">
                <input
                  id="pjp-salary"
                  className="pjp-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.salary}
                  onChange={set("salary")}
                />
              </Field>

              <Field label="Pay period" htmlFor="pjp-salary-type">
                <div className="pjp-pill-group" role="group" aria-label="Salary type">
                  {SALARY_TYPES.map((t) => (
                    <button
                      key={t}
                      id={`pjp-salary-type-${t}`}
                      type="button"
                      className={`pjp-pill${form.salary_type === t ? " selected" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, salary_type: t }))}
                      aria-pressed={form.salary_type === t}
                    >
                      / {t}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Workers Needed" htmlFor="pjp-workers">
              <input
                id="pjp-workers"
                className="pjp-input pjp-input-sm"
                type="number"
                min="1"
                placeholder="1"
                value={form.workers_needed}
                onChange={set("workers_needed")}
              />
            </Field>
          </Section>

          {/* ━━ Requirements ━━ */}
          <Section icon="👤" title="Requirements">
            <Field label="Gender" htmlFor="pjp-gender">
              <div className="pjp-pill-group" role="group" aria-label="Gender requirement">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g}
                    id={`pjp-gender-${g.toLowerCase()}`}
                    type="button"
                    className={`pjp-pill${form.gender_requirement === g ? " selected" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, gender_requirement: g }))}
                    aria-pressed={form.gender_requirement === g}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Age Requirement" htmlFor="pjp-age" hint='e.g. "18+" or "18–35"'>
              <input
                id="pjp-age"
                className="pjp-input pjp-input-sm"
                type="text"
                placeholder="Any"
                value={form.age_requirement}
                onChange={set("age_requirement")}
              />
            </Field>
          </Section>

          {/* ━━ Schedule ━━ */}
          <Section icon="🗓️" title="Schedule">
            <div className="pjp-row">
              <Field label="Work Date" htmlFor="pjp-date" required>
                <input
                  id="pjp-date"
                  className="pjp-input"
                  type="date"
                  value={form.work_date}
                  onChange={set("work_date")}
                />
              </Field>

              <Field label="Work Time" htmlFor="pjp-time" hint='e.g. "8 AM – 5 PM"'>
                <input
                  id="pjp-time"
                  className="pjp-input"
                  type="text"
                  placeholder="e.g. 8 AM – 5 PM"
                  value={form.work_time}
                  onChange={set("work_time")}
                />
              </Field>
            </div>

            <Field label="Listing Expires" htmlFor="pjp-expire" hint="When should this job listing stop showing?">
              <input
                id="pjp-expire"
                className="pjp-input"
                type="datetime-local"
                value={form.job_expire_time}
                onChange={set("job_expire_time")}
              />
            </Field>
          </Section>

          {/* ━━ Location ━━ */}
          <Section icon="📍" title="Location">
            <Field label="Location Description" htmlFor="pjp-loc" required>
              <input
                id="pjp-loc"
                className="pjp-input"
                type="text"
                placeholder="e.g. Near Ernakulam Junction, Kochi"
                value={form.location_text}
                onChange={set("location_text")}
              />
            </Field>

            <Field label="Pin on Map" htmlFor="pjp-map" hint="Tap the map to drop a pin exactly where the job is." required>
              <div className="pjp-map-toolbar">
                <button
                  id="pjp-use-location-btn"
                  type="button"
                  className="pjp-use-location-btn"
                  onClick={useMyLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <span className="pjp-spinner" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                      <path d="M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M4.93 19.07l1.41-1.41" />
                    </svg>
                  )}
                  Use my location
                </button>
                {coords && (
                  <span className="pjp-coords-badge">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                )}
              </div>

              <div className={`pjp-map-wrap${coords ? " has-pin" : ""}`}>
                <MapContainer
                  key={`${mapCenter.lat}-${mapCenter.lng}`}
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={14}
                  zoomControl
                  attributionControl={false}
                  className="pjp-map"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <MapClickHandler onPick={handleMapPick} />
                  {coords && (
                    <Marker position={[coords.lat, coords.lng]} icon={PIN_ICON} />
                  )}
                </MapContainer>
                {!coords && (
                  <div className="pjp-map-prompt" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    Tap to pin location
                  </div>
                )}
              </div>
            </Field>
          </Section>

          {/* ━━ Contact ━━ */}
          <Section icon="📞" title="Contact">
            <Field label="Contact Number" htmlFor="pjp-contact" hint="Workers will call or WhatsApp this number." required>
              <input
                id="pjp-contact"
                className="pjp-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.contact}
                onChange={set("contact")}
                required
              />
            </Field>
          </Section>

          {/* ━━ Error ━━ */}
          {error && (
            <div className="pjp-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                {error}
                {(error.toLowerCase().includes("session") || error.toLowerCase().includes("log in")) && (
                  <> &nbsp;<button
                    type="button"
                    className="pjp-error-link"
                    onClick={() => navigate("/login")}
                  >Log in again →</button></>
                )}
              </span>
            </div>
          )}

        </div>

        {/* ── Sticky submit bar ── */}
        <div className="pjp-submit-bar">
          <button
            id="pjp-submit-btn"
            className="pjp-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="pjp-spinner" /> : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Post Job
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
