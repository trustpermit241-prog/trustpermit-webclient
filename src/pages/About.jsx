import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      {/* Hero Card */}
      <div className="card hero-card">
        <h1>About TRUST PERMIT</h1>
        <p>
          TRUST PERMIT is an innovative system designed to simplify business permit
          applications, renewals, and inspections. We aim to reduce bureaucracy, save time,
          and provide clear, transparent guidance for business owners.
        </p>
      </div>

      {/* Mission Section */}
      <div className="card section-card">
        <h2>Our Mission</h2>
        <p>
          To empower entrepreneurs by providing a fast, secure, and user-friendly platform
          that ensures compliance with city regulations without the hassle of long queues
          or unnecessary paperwork.
        </p>
      </div>

      {/* Vision Section */}
      <div className="card section-card">
        <h2>Our Vision</h2>
        <p>
          To be the most trusted and efficient business permit system in the country,
          fostering economic growth while making governance transparent and accessible.
        </p>
      </div>

      {/* Why Choose Us Section */}
      <div className="card section-card">
        <h2>Why Choose TRUST PERMIT?</h2>
        <ul>
          <li>Streamlined process – complete applications quickly online.</li>
          <li>Real-time updates – track the status of your permit anytime.</li>
          <li>Reliable & secure – your data is protected at every step.</li>
          <li>Professional support – expert assistance when you need it.</li>
        </ul>
      </div>
    </div>
  );
}
