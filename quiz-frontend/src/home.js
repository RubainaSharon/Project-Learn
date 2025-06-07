import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "./navbar";
import { FaGithub, FaBlog, FaEnvelope, FaLinkedin, FaDiscord, FaYoutube } from "react-icons/fa";

const Home = ({ username }) => {
  const [activeSkill, setActiveSkill] = useState(null);
  const [isSkillsVisible, setIsSkillsVisible] = useState(false);
  const [typedText, setTypedText] = useState("");
  const skillsRef = useRef(null);
  const homeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSkillsVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    if (skillsRef.current) observer.observe(skillsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const word = "Learn";
    let index = 0;
    const interval = setInterval(() => {
      if (index < word.length) {
        setTypedText(word.slice(0, index + 1));
        index += 1;
      } else {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('https://project-learn.onrender.com/')
      .then(() => console.log('Backend warmed up'))
      .catch(() => console.log('Warming up failed, but proceeding...'));
  }, []);

  const skillData = {
    Programming: ["C", "C++", "Python", "SQL", "Java", "JavaScript", "HTML", "CSS"],
    Technology: [
      "Data Analysis",
      "Machine Learning & Artificial Intelligence",
      "Cloud Computing",
      "Cybersecurity",
      "Blockchain Technology",
      "Docker",
      "Kubernetes",
    ],
    "Business Skills": ["Stock Market", "Digital Marketing"],
    "Soft Skills": ["Communication Skills", "Leadership", "Time Management", "Resilience", "Adaptability"],
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center">
      <Navbar homeRef={homeRef} skillsRef={skillsRef} username={username} />

      {/* Animated Learn */}
      <div
        ref={homeRef}
        id="home"
        className="flex items-center justify-center h-screen w-full relative overflow-hidden"
      >
        <h1
          className="font-extrabold text-center text-white 
             text-[3.5rem] xs:text-6xl sm:text-7xl md:text-8xl 
             lg:text-9xl xl:text-[20rem] 
             leading-tight tracking-tight 
             animate-mobile-learn drop-shadow-md font-nebulax"
        >
          {typedText}
        </h1>
      </div>

      {/* Skills Section */}
      <div
        id="skills"
        ref={skillsRef}
        className={`flex flex-col items-center justify-center min-h-screen text-center pb-32 transition-opacity duration-[2000ms] ${
          isSkillsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-6xl font-extrabold mb-16">What do you yearn to learn?</h2>
        <ul className="text-4xl space-y-10 font-bold">
          {Object.keys(skillData).map((skill) => (
            <li key={skill} className="flex flex-col items-center">
              <div
                className={`cursor-pointer border border-white p-4 transition-all duration-300 hover:scale-105 ${
                  activeSkill === skill ? "border-2" : ""
                }`}
                onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
              >
                {skill}
              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  activeSkill === skill ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="text-3xl space-y-3 mt-4">
                  {skillData[skill].map((item) => (
                    <li key={item} className="cursor-pointer hover:underline">
                      <Link to={`/check-quiz/${item}`}>{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Social Links Section */}
      <footer className="w-full py-8 bg-gradient-to-b from-gray-900 to-black text-center">
        <h2 className="text-2xl font-bold mb-4">Connect With Me</h2>
        <div className="flex justify-center gap-6">
          <a
            href="https://github.com/RubainaSharon"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl text-gray-300 hover:text-purple-400 transition-transform transform hover:scale-110 animate-pulse-slow"
          >
            <FaGithub />
          </a>
          <a
            href="https://projectpyai.hashnode.space/default-guide/set-vs-code"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl text-gray-300 hover:text-blue-400 transition-transform transform hover:scale-110 animate-pulse-slow"
          >
            <FaBlog />
          </a>
          <a
            href="mailto:rubainasharon@gmail.com"
            className="text-3xl text-gray-300 hover:text-green-400 transition-transform transform hover:scale-110 animate-pulse-slow"
          >
            <FaEnvelope />
          </a>
          <a
            href="https://www.linkedin.com/in/rubaina-sharon-4567b9210"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl text-gray-300 hover:text-blue-600 transition-transform transform hover:scale-110 animate-pulse-slow"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://discordapp.com/users/rubainasharon7639"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl text-gray-300 hover:text-purple-600 transition-transform transform hover:scale-110 animate-pulse-slow"
          >
            <FaDiscord />
          </a>
          
        </div>
      </footer>
    </div>
  );
};

// Animation keyframes
const styles = `
  @font-face {
    font-family: 'Nebulax';
    src: url('./assets/Nebulax.ttf') format('truetype'),
         url('./assets/Nebulax.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pulseSlow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes popGlow {
    0% {
      transform: scale(0.9);
      opacity: 0;
      text-shadow: none;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
      text-shadow: 0 0 10px rgba(255,255,255,0.5);
    }
    100% {
      transform: scale(1);
      text-shadow: none;
    }
  }

  .animate-pulse-slow {
    animation: pulseSlow 2s infinite;
  }

  .font-nebulax {
    font-family: 'Nebulax', sans-serif;
  }

  @media (max-width: 639px) {
    .animate-mobile-learn {
      animation: popGlow 1.5s ease-out;
    }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Home;
