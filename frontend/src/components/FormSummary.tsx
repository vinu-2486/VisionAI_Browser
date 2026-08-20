const fields = [
  ["Full Name", "Rakshan"],
  ["Date of Birth", "12 August 2006"],
  ["Address", "Chennai, Tamil Nadu"],
  ["Mobile Number", "+91 XXXXX XXXXX"],
  ["Purpose", "Education"],
];

export default function FormSummary() {
  return (
    <div className="review-page">

      <div className="review-intro">

        <div className="eyebrow">
          APPLICATION REVIEW
        </div>

        <h1>
          Income Certificate
        </h1>

        <p>
          VisionAI has collected the required
          information. Verify it before continuing.
        </p>

      </div>

      <div className="review-progress-card">

        <div className="review-progress-header">

          <div>
            <small>
              FORM COMPLETION
            </small>

            <strong>
              4 of 5 steps complete
            </strong>
          </div>

          <span className="ready-badge">
            Ready for review
          </span>

        </div>

        <div className="progress-bar">
          <span />
        </div>

        <div className="progress-footer">
          <span>
            Information captured
          </span>

          <b>
            82%
          </b>
        </div>

      </div>

      <div className="review-fields">

        {fields.map(([label, value]) => (
          <div
            className="review-field-card"
            key={label}
          >

            <div className="field-title">
              <small>
                {label}
              </small>

              <span>
                ✓ VERIFIED
              </span>
            </div>

            <strong>
              {value}
            </strong>

          </div>
        ))}

      </div>

      <div className="confirmation-panel">

        <div className="confirmation-symbol">
          !
        </div>

        <div className="confirmation-copy">

          <small>
            FINAL CHECK
          </small>

          <h2>
            You remain in control.
          </h2>

          <p>
            VisionAI will not submit the application
            automatically. Review the information and
            explicitly confirm before continuing.
          </p>

        </div>

        <div className="confirmation-actions">

          <button className="primary-cta">
            ✓ Confirm information
          </button>

          <button className="secondary-cta">
            ← Edit information
          </button>

        </div>

      </div>

    </div>
  );
}