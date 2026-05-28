import { useNavigate } from "react-router-dom";
import "./Contact.css";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div className="contact-page">
      {/* Floating Help Button */}
      <button
        className="help-icon-btn"
        onClick={() => navigate("/ask-help")}
        aria-label="Ask for help"
      >
        💬
      </button>

      <div className="contact-card">
        {/* ── Left Column ── */}
        <div className="contact-left">
          <p className="contact-label">Get in Touch</p>
          <h1 className="contact-title">Contact us</h1>
          <p className="contact-description">
            We're here to help with your permit applications and questions
          </p>

          <div className="contact-info-list">
            {/* Quick Contact */}
            <div className="info-section">
              <div className="info-section-header">
                <span className="info-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.4 4.5H5.8A1.8 1.8 0 0 0 4 6.3c0 8.2 6.7 14.9 14.9 14.9a1.8 1.8 0 0 0 1.8-1.8v-1.6a1.8 1.8 0 0 0-1.2-1.7l-2.8-1c-.6-.2-1.2 0-1.6.5l-1.2 1.5A12.5 12.5 0 0 1 8 10l1.4-1.1c.5-.4.7-1.1.5-1.6l-1-2.8a1.8 1.8 0 0 0-1.5-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <h3 className="info-section-title">Quick Contact</h3>
              </div>
              <div className="info-entries">
                <div className="info-entry">
                  <strong>Main Office</strong>
                  <p>Phone: (043) 645-2668</p>
                  <p>Email: info@antipolo.gov.ph</p>
                </div>
                <div className="info-entry">
                  <strong>Permit Services</strong>
                  <p>Phone: (043) 645-2669</p>
                  <p>Email: permits@antipolo.gov.ph</p>
                </div>
                <div className="info-entry">
                  <strong>Inspection Division</strong>
                  <p>Phone: (043) 645-2670</p>
                  <p>Email: inspections@antipolo.gov.ph</p>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="info-section">
              <div className="info-section-header">
                <span className="info-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <h3 className="info-section-title">Operating Hours</h3>
              </div>
              <div className="info-entries hours-entries">
                <div className="hour-row">
                  <span className="hour-day">Monday - Friday</span>
                  <span className="hour-time">8:00 AM - 5:00 PM</span>
                </div>
                <div className="hour-row">
                  <span className="hour-day">Saturday</span>
                  <span className="hour-time">8:00 AM - 12:00 PM</span>
                </div>
                <div className="hour-row">
                  <span className="hour-day">Sunday &amp; Holidays</span>
                  <span className="hour-time">Closed</span>
                </div>
              </div>
            </div>

            {/* Office Location */}
            <div className="info-section">
              <div className="info-section-header">
                <span className="info-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21c3.8-3.5 6-6.3 6-9.4A5.5 5.5 0 0 0 12.5 6 5.5 5.5 0 0 0 7 11.6c0 3.1 2.2 5.9 6 9.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12.5" cy="11.2" r="2" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                </span>
                <h3 className="info-section-title">Office Location</h3>
              </div>
              <div className="info-entries">
                <div className="info-entry">
                  <strong>Antipolo City Hall</strong>
                  <p>Rizal Avenue, Antipolo City</p>
                  <p>Rizal, Philippines 1870</p>
                  <p className="info-note">Free parking available for visitors.</p>
                </div>
              </div>
            </div>

            {/* Need Quick Help */}
            <div className="info-section">
              <div className="info-section-header">
                <span className="info-section-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M9.5 9.5a2.7 2.7 0 0 1 5.1 1c0 1.8-2.6 2.5-2.6 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="12" cy="17.5" r="0.8" fill="currentColor"/>
                  </svg>
                </span>
                <h3 className="info-section-title">Need Quick Help?</h3>
              </div>
              <div className="info-entries">
                <p className="info-body">
                  Visit our <strong>Ask Help</strong> section in the menu for instant answers to common questions about permits and clearances.
                </p>
                <p className="ai-link">Available 24/7 with our AI Assistant</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column – Illustration ── */}
        <div className="contact-right" aria-hidden="true">
          <svg className="contact-illustration" viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Decorative dots – top left */}
            <circle cx="32" cy="52" r="7" fill="#f59e0b" opacity="0.55"/>
            <circle cx="58" cy="30" r="4.5" fill="#f59e0b" opacity="0.4"/>
            <circle cx="16" cy="36" r="3.5" fill="#f59e0b" opacity="0.35"/>

            {/* Ground line */}
            <line x1="28" y1="308" x2="292" y2="308" stroke="#c9a870" strokeWidth="2.2"/>

            {/* Legs */}
            <path d="M148 258 L140 308" stroke="#1f2937" strokeWidth="5" strokeLinecap="round"/>
            <path d="M172 258 L180 308" stroke="#1f2937" strokeWidth="5" strokeLinecap="round"/>

            {/* Body / orange shirt with dots */}
            <rect x="132" y="190" width="56" height="70" rx="8" fill="#f59e0b" stroke="#1f2937" strokeWidth="2.2"/>
            <circle cx="148" cy="208" r="3" fill="#d97706"/>
            <circle cx="162" cy="218" r="3" fill="#d97706"/>
            <circle cx="176" cy="208" r="3" fill="#d97706"/>
            <circle cx="148" cy="228" r="3" fill="#d97706"/>
            <circle cx="176" cy="230" r="3" fill="#d97706"/>
            <circle cx="162" cy="242" r="3" fill="#d97706"/>
            <circle cx="148" cy="252" r="3" fill="#d97706"/>
            <circle cx="176" cy="252" r="3" fill="#d97706"/>

            {/* Neck */}
            <rect x="152" y="186" width="16" height="10" rx="3" fill="#fcd9a0"/>

            {/* Head */}
            <ellipse cx="160" cy="155" rx="30" ry="32" fill="#fcd9a0" stroke="#1f2937" strokeWidth="2.2"/>

            {/* Cap */}
            <path d="M133 148 Q160 143 187 148" fill="#1f2937" stroke="#1f2937" strokeWidth="1"/>
            <path d="M135 148 Q135 126 160 124 Q185 126 185 148Z" fill="#1f2937"/>
            <path d="M133 148 Q116 152 119 158 Q121 161 135 156Z" fill="#1f2937"/>

            {/* Sunglasses */}
            <rect x="143" y="151" width="15" height="10" rx="4" fill="#1f2937"/>
            <rect x="162" y="151" width="15" height="10" rx="4" fill="#1f2937"/>
            <line x1="158" y1="156" x2="162" y2="156" stroke="#1f2937" strokeWidth="2"/>
            <line x1="143" y1="154" x2="140" y2="152" stroke="#1f2937" strokeWidth="2"/>
            <line x1="177" y1="154" x2="180" y2="152" stroke="#1f2937" strokeWidth="2"/>

            {/* Smile */}
            <path d="M152 174 Q160 181 168 174" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" fill="none"/>

            {/* Left arm – relaxed down */}
            <path d="M132 210 Q112 232 116 250" stroke="#fcd9a0" strokeWidth="14" strokeLinecap="round"/>
            <path d="M132 210 Q112 232 116 250" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" fill="none"/>

            {/* Right arm – raised, holding sign */}
            <path d="M188 202 Q216 178 240 168" stroke="#fcd9a0" strokeWidth="14" strokeLinecap="round"/>
            <path d="M188 202 Q216 178 240 168" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" fill="none"/>

            {/* Sign / board */}
            <rect x="234" y="130" width="82" height="54" rx="6" fill="white" stroke="#1f2937" strokeWidth="2.2"/>
            {/* Pin */}
            <circle cx="241" cy="136" r="4.5" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.5"/>
            {/* PERMIT text */}
            <text x="275" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0d47a1" fontFamily="Arial, sans-serif">PERMIT</text>
            {/* Checkmark */}
            <path d="M255 168 L261 175 L277 160" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Decorative dots – top right */}
            <circle cx="296" cy="76" r="6" fill="#f59e0b" opacity="0.55"/>
            <circle cx="312" cy="100" r="4" fill="#f59e0b" opacity="0.4"/>
            <circle cx="304" cy="56" r="3" fill="#f59e0b" opacity="0.35"/>
          </svg>
        </div>
      </div>
    </div>
  );
}