import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddJobButton.css";

export default function AddJobButton({ isLoggedIn }) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  function handleClick() {
    if (isLoggedIn) {
      navigate("/post-job");
    } else {
      setShowModal(true);
    }
  }

  function closeModal() {
    setShowModal(false);
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="add-job-fab"
        className="add-job-fab"
        type="button"
        aria-label="Add a job posting"
        onClick={handleClick}
      >
        <svg
          className="add-job-fab-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="add-job-fab-label">Add Job</span>
      </button>

      {/* Login-gate Modal */}
      {showModal && (
        <div
          className="ajb-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ajb-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="ajb-modal">
            {/* Close */}
            <button
              className="ajb-modal-close"
              type="button"
              aria-label="Close"
              onClick={closeModal}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="ajb-modal-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2Z" />
                <path d="M12 12v4M10 14h4" />
              </svg>
            </div>

            <h2 id="ajb-modal-title" className="ajb-modal-title">
              Post a Job
            </h2>
            <p className="ajb-modal-body">
              You need an account to post a job listing. Log in if you already
              have one, or sign up — it's free and takes only a minute.
            </p>

            <div className="ajb-modal-actions">
              <button
                id="ajb-login-btn"
                className="ajb-btn ajb-btn-primary"
                type="button"
                onClick={() => {
                  closeModal();
                  navigate("/login");
                }}
              >
                Log in
              </button>
              <button
                id="ajb-signup-btn"
                className="ajb-btn ajb-btn-secondary"
                type="button"
                onClick={() => {
                  closeModal();
                  navigate("/signup");
                }}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
