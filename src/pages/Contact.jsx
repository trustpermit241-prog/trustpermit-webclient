import "./Contact.css";

export default function Contact() {
  return (
    <div className="contact-container">
      {/* Main Content */}
      <div className="contact-main single">
        <div className="contact-info card">
          <h3>Contact Us</h3>
          <p>
            For inquiries, permit applications, inspections, and other concerns,
            you may contact our City Hall staff using the information below.
          </p>

          <p><strong>Email:</strong> antipolo@cityhall.com</p>
          <p><strong>Phone:</strong> 0999 874 5215</p>
          <p><strong>Address:</strong> Antipolo City Hall, Antipolo, Rizal</p>

          <p>
            Our online portal allows you to apply for permits, track inspections,
            and manage applications anytime in a secure digital environment.
          </p>
        </div>
      </div>
    </div>
  );
}
