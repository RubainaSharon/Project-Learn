import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./home";
import Quiz from "./Quiz";
import About from "./about";
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import UsernamePrompt from "./UsernamePrompt";
import LearningJourney from "./LearningJourney";
import TakeQuizPrompt from "./TakeQuizPrompt";
import "./index.css";

function App() {
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cursor = document.createElement("div");
    cursor.classList.add("custom-cursor");
    document.body.appendChild(cursor);

    const moveCursor = (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;

      const particle = document.createElement("div");
      particle.classList.add("cursor-particle");
      particle.style.left = `${e.clientX}px`;
      particle.style.top = `${e.clientY}px`;

      document.body.appendChild(particle);
      void particle.offsetHeight;

      const angle = Math.random() * 2 * Math.PI;
      const distance = 20 + Math.random() * 20;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      particle.style.transform = `translate(${x}px, ${y}px) scale(0.5)`;
      particle.style.opacity = "0";

      setTimeout(() => particle.remove(), 500);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      cursor.remove();
    };
  }, []);

  useEffect(() => {
    if (username) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000); // 1 second
      return () => clearTimeout(timer);
    }
  }, [username]);

  // ✅ If username not set, show only UsernamePrompt
  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <UsernamePrompt setUsername={setUsername} />
      </div>
    );
  }

  // ✅ After username entered, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  // ✅ After loading, render full app
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home username={username} />} />
        <Route path="/check-quiz/:skill" element={<TakeQuizPrompt />} />
        <Route path="/quiz/:skill" element={<Quiz username={username} />} />
        <Route path="/learning-journey/:skill" element={<LearningJourney />} />
        <Route path="/about" element={<About username={username} />} />
        <Route path="/profile" element={<Profile username={username} />} />
        <Route path="/dashboard" element={<Dashboard username={username} />} />
      </Routes>
    </Router>
  );
}

export default App;
