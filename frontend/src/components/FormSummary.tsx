import { useEffect, useState } from "react";

interface SavedApplication {
  id: number;
  service_title: string;
  status: string;
  progress: number;
  data: Record<string, unknown>;
}

interface FormSummaryProps {
  onContinue: (applicationId: number) => void;
}

const API_URL = "http://localhost:8000/api";

function displayName(application: SavedApplication) {
  const name = application.data.fullName;
  return typeof name === "string" && name.trim()
    ? name
    : "Unnamed application";
}

export default function FormSummary({
  onContinue,
}: FormSummaryProps) {
  const [applications, setApplications] = useState<SavedApplication[]>([]);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/forms?limit=50`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load saved applications.");
        }
        setApplications(await response.json());
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load saved applications."
        );
      });
  }, []);

  const deleteApplication = async (applicationId: number) => {
    if (!window.confirm("Delete this saved application permanently?")) {
      return;
    }

    setDeletingId(applicationId);
    try {
      const response = await fetch(`${API_URL}/forms/${applicationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Unable to delete this application.");
      }
      setApplications((current) =>
        current.filter((application) => application.id !== applicationId)
      );
      if (reviewingId === applicationId) {
        setReviewingId(null);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this application."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="review-page">
      <div className="review-intro">
        <div className="eyebrow">SAVED APPLICATIONS</div>
        <h1>Your applications</h1>
        <p>Continue an unfinished form without losing information after a refresh.</p>
      </div>

      {error && <p role="alert">{error}</p>}
      {!error && applications.length === 0 && (
        <p>No saved applications yet. Choose a service to start one.</p>
      )}

      <div className="review-fields">
        {applications.map((application) => {
          const resumable = ["draft", "in_progress"].includes(application.status);
          return (
            <article className="review-field-card" key={application.id}>
              <div className="field-title">
                <small>{application.service_title}</small>
                <span>{application.status.replace("_", " ").toUpperCase()}</span>
              </div>
              <strong>{displayName(application)}</strong>
              <div className="progress-footer">
                <span>{application.progress}% complete</span>
                <div className="confirmation-actions">
                  <button
                    className="secondary-cta"
                    onClick={() =>
                      setReviewingId((current) =>
                        current === application.id ? null : application.id
                      )
                    }
                  >
                    {reviewingId === application.id ? "Hide form" : "Review form"}
                  </button>
                  {resumable && (
                  <button
                    className="secondary-cta"
                    onClick={() => onContinue(application.id)}
                  >
                    Continue
                  </button>
                  )}
                  <button
                    className="danger-cta"
                    disabled={deletingId === application.id}
                    onClick={() => void deleteApplication(application.id)}
                  >
                    {deletingId === application.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
              {reviewingId === application.id && (
                <div className="review-form-details" aria-label="Saved form details">
                  {Object.entries(application.data).length === 0 ? (
                    <p>No fields have been saved yet.</p>
                  ) : (
                    Object.entries(application.data).map(([field, value]) => (
                      <div className="review-field-card" key={field}>
                        <small>{field.replace(/([A-Z])/g, " $1")}</small>
                        <strong>{String(value)}</strong>
                      </div>
                    ))
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
