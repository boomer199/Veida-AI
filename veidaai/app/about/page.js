import React from 'react';
import { FaSyncAlt, FaLightbulb, FaBook, FaLinkedin } from 'react-icons/fa';
import './about.css';

const AboutUs = () => {
  return (
    <div className="about-us-container">
      {/* Hero Image Banner */}
      <div className="hero-banner">
        <h1 className="hero-title">By Students, For Students</h1>
      </div>

      {/* Content Wrapper */}
      <div className="content-wrapper">
        {/* The Struggle Section */}
        <section className="struggle-section">
          <h2 className="section-title">Our Why</h2>
          <p className="story-text">
            We've all been there—late nights fueled by caffeine, endless hours of studying, and the constant juggling act of maintaining a social life, staying healthy, and still excelling in our classes. The pressure to tackle fast-paced courses while balancing everything else can be overwhelming. These shared struggles inspired us to find a smarter, more fun and effective way to learn.
          </p>
        </section>

        {/* Our Solution Section */}
        <section className="solution-section">
          <h2 className="section-title">Our Solution</h2>
          <p className="story-text">
            Introducing Veida AI, an app created by students, for students! AI-powered and designed to optimize your learning experience—here’s how:
          </p>
          <ul className="features-list">
            <li className="feature-item">
              <FaSyncAlt className="feature-icon" />
              <div>
                <h3>Course Integration</h3>
                <p>Effortlessly sync your syllabus, materials, and notes for seamless organization.</p>
              </div>
            </li>
            <li className="feature-item">
              <FaLightbulb className="feature-icon" />
              <div>
                <h3>Spaced Retrieval Practice</h3>
                <p>Boost retention in 5 steps: synthesize, reorganize, compare, apply, and contextualize.</p>
              </div>
            </li>
            <li className="feature-item">
              <FaBook className="feature-icon" />
              <div>
                <h3>Smart Study Tools</h3>
                <p>Summarize lectures, create study plans, and track your progress with ease.</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Meet the Founders Section */}
        <h2 className="section-title" style={{ marginTop: '4rem' }}>Meet the Founders</h2>
        <section className="founders-grid">
          <div className="founder-card">
            <img src="/sancho.jpg" alt="Sancho Syquia" className="founder-image" />
            <h3 className="founder-name">
              Sancho Syquia
              <a href="https://linkedin.com/in/ssyquia" target="_blank" className="founder-linkedin">
                <FaLinkedin className="linkedin-icon" />
              </a>
            </h3>
            <p className="founder-school">UC San Diego</p>
          </div>
          <div className="founder-card">
            <img src="/everett.jpg" alt="Everett Villiger" className="founder-image" />
            <h3 className="founder-name">
              Everett Villiger
              <a href="https://www.linkedin.com/in/everett-villiger-622002295/" target="_blank" className="founder-linkedin">
                <FaLinkedin className="linkedin-icon" />
              </a>
            </h3>
            <p className="founder-school">University of Wisconsin</p>
          </div>
          <div className="founder-card">
            <img src="/derek.jpg" alt="Derek Gomez" className="founder-image" />
            <h3 className="founder-name">
              Derek Gomez
              <a href="https://linkedin.com/in/derekgomez" target="_blank" className="founder-linkedin">
                <FaLinkedin className="linkedin-icon" />
              </a>
            </h3>
            <p className="founder-school">UC Santa Cruz</p>
          </div>
          <div className="founder-card">
            <img src="/riyaadh.jpg" alt="Riyaadh Bukhsh" className="founder-image" />
            <h3 className="founder-name">
              Riyaadh Bukhsh
              <a href="https://linkedin.com/in/riyaadhbukhsh" target="_blank" className="founder-linkedin">
                <FaLinkedin className="linkedin-icon" />
              </a>
            </h3>
            <p className="founder-school">UC Davis</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
