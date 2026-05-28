import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import heroTemplateOne from "../assets/sample5.jpg";
import heroTemplateTwo from "../assets/sample6.jpg";
import heroTemplateThree from "../assets/sample3.jpg";
import heroTemplateFour from "../assets/sample4.jpg";
import valueImageOne from "../assets/picture1.jpg";
import valueImageTwo from "../assets/picture2.jpg";
import valueImageThree from "../assets/picture3.jpg";
import "./About.css";

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    const items = document.querySelectorAll(".about-animate");
    const reveal = () => {
      items.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 80) {
          el.classList.add("show");
        }
      });
    };
    window.addEventListener("scroll", reveal);
    reveal();
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  return (
    <div className="about-page">
      <button
        className="help-icon-btn"
        onClick={() => navigate("/ask-help")}
        aria-label="Ask for help"
      >
        💬
      </button>

      <section className="about-animate about-hero">
        <div className="about-wrap">
          <div className="about-grid">
            <div>
              <h1>WHAT WE DO?</h1>
              <p>
                A digital permit management system designed to simplify and modernize the application, 
                processing, and approval of Business Permits. We provide a secure and efficient platform where 
                citizens can submit permit requests online, track their application status in real time, and receive updates 
                without the need for long queues or manual processing. Our system helps streamline workflows 
                for local government units, making public service faster, more transparent, and more accessible.
              </p>
            </div>
            <div className="hero-template-grid" aria-label="Hero image templates">
              <div className="hero-template-card">
                <img src={heroTemplateOne} alt="Template image one" className="hero-template-image" />
              </div>
              <div className="hero-template-card">
                <img src={heroTemplateTwo} alt="Template image two" className="hero-template-image" />
              </div>
              <div className="hero-template-card">
                <img src={heroTemplateThree} alt="Template image three" className="hero-template-image" />
              </div>
              <div className="hero-template-card">
                <img src={heroTemplateFour} alt="Template image four" className="hero-template-image" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-animate about-values">
        <div className="about-wrap">
          <h2 className="center">WHO WE ARE?</h2>
          <div className="value-grid">
            <div className="value-template">
              <img src={valueImageOne} alt="Value template one" className="value-template-image" />
            </div>
            <div className="value-template">
              <img src={valueImageTwo} alt="Value template two" className="value-template-image" />
            </div>
            <div className="value-template">
              <img src={valueImageThree} alt="Value template three" className="value-template-image" />
            </div>
          </div>
        </div>
      </section>

      <section className="about-animate about-cta">
        <div className="about-wrap">
          <p>
            The Gantt Gang developers committed to improving public service through technology. 
            This system was created as a capstone project to address the challenges of traditional permit 
            processing systems, such as delays, lack of transparency, and manual paperwork. 
            Our goal is to build a reliable and user-friendly platform that bridges citizens and government offices 
            through digital innovation, promoting convenience, efficiency, and trust in public service delivery.
          </p>
        </div>
      </section>
    </div>
  );
}