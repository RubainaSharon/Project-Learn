import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import * as PIXI from "pixi.js";

const Quiz = ({ username }) => {
  const { skill } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef(null);
  const appRef = useRef(null);

  // Initialize PixiJS animation
  useEffect(() => {
    // Initialize PixiJS application using the v7.x constructor
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      resizeTo: window,
      antialias: true,
    });
    appRef.current = app;

    // Append the canvas to the DOM
    if (canvasRef.current) {
      canvasRef.current.appendChild(app.view);
      console.log("PixiJS canvas appended successfully.");
    } else {
      console.error("canvasRef.current is null, cannot append PixiJS canvas.");
      return;
    }

    // Entities arrays
    const whales = [];
    const jellyfish = [];
    const starships = [];
    const particles = [];

    // Whale creation
    const createWhale = () => {
      const whale = new PIXI.Graphics();
      whale.beginFill(0x4b0082, 0.7);
      whale.drawEllipse(0, 0, 30, 15);
      whale.endFill();
      whale.position.set(Math.random() * app.screen.width, Math.random() * app.screen.height);
      whale.velocity = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
      app.stage.addChild(whale);
      return whale;
    };

    // Jellyfish creation
    const createJellyfish = () => {
      const jelly = new PIXI.Graphics();
      jelly.beginFill(0x00b7eb, 0.6);
      jelly.drawCircle(0, 0, 20);
      jelly.endFill();
      jelly.position.set(Math.random() * app.screen.width, Math.random() * app.screen.height);
      jelly.velocity = { x: (Math.random() - 0.5) * 1, y: (Math.random() - 0.5) * 1 };
      jelly.pulse = Math.random() * Math.PI;
      app.stage.addChild(jelly);
      return jelly;
    };

    // Starship creation
    const createStarship = () => {
      const ship = new PIXI.Graphics();
      ship.beginFill(0xff4500, 0.8);
      ship.drawPolygon([0, -10, 8, 10, -8, 10]);
      ship.endFill();
      ship.scale.set(0.5);
      ship.position.set(Math.random() * app.screen.width, Math.random() * app.screen.height);
      ship.velocity = { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 };
      app.stage.addChild(ship);
      return ship;
    };

    // Particle creation
    const createParticle = (x, y, color = 0xffffff) => {
      const particle = new PIXI.Graphics();
      particle.beginFill(color, 0.5);
      particle.drawCircle(0, 0, 3);
      particle.endFill();
      particle.position.set(x, y);
      particle.velocity = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 };
      particle.life = 60;
      app.stage.addChild(particle);
      particles.push(particle);
    };

    // Initialize entities (scale count based on screen size)
    const entityCount = Math.min(Math.floor(app.screen.width / 100) + 5, 20);
    for (let i = 0; i < entityCount; i++) {
      whales.push(createWhale());
      jellyfish.push(createJellyfish());
      starships.push(createStarship());
    }
    console.log(`Initialized ${whales.length} whales, ${jellyfish.length} jellyfish, and ${starships.length} starships.`);

    // Animation loop
    let time = 0;
    app.ticker.add(() => {
      time += 0.02;

      // Update whales
      whales.forEach((whale) => {
        whale.position.x += whale.velocity.x;
        whale.position.y += whale.velocity.y;
        if (whale.position.x < 0 || whale.position.x > app.screen.width) whale.velocity.x *= -1;
        if (whale.position.y < 0 || whale.position.y > app.screen.height) whale.velocity.y *= -1;
        if (Math.random() < 0.01) createParticle(whale.position.x, whale.position.y, 0x4b0082);
      });

      // Update jellyfish
      jellyfish.forEach((jelly) => {
        jelly.position.x += jelly.velocity.x;
        jelly.position.y += jelly.velocity.y;
        jelly.pulse += 0.05;
        jelly.scale.set(1 + Math.sin(jelly.pulse) * 0.2);
        if (jelly.position.x < 0 || jelly.position.x > app.screen.width) jelly.velocity.x *= -1;
        if (jelly.position.y < 0 || jelly.position.y > app.screen.height) jelly.velocity.y *= -1;
        if (Math.random() < 0.02) createParticle(jelly.position.x, jelly.position.y, 0x00b7eb);
      });

      // Update starships (simple swarm behavior)
      starships.forEach((ship, i) => {
        ship.position.x += ship.velocity.x;
        ship.position.y += ship.velocity.y;
        if (ship.position.x < 0 || ship.position.x > app.screen.width) ship.velocity.x *= -1;
        if (ship.position.y < 0 || ship.position.y > app.screen.height) ship.velocity.y *= -1;
        if (i === 0) return; // Leader
        const leader = starships[0];
        ship.velocity.x += (leader.position.x - ship.position.x) * 0.001;
        ship.velocity.y += (leader.position.y - ship.position.y) * 0.001;
        if (Math.random() < 0.005) {
          const target = starships[Math.floor(Math.random() * starships.length)];
          const line = new PIXI.Graphics();
          line.lineStyle(1, 0xff4500, 0.5);
          line.moveTo(ship.position.x, ship.position.y);
          line.lineTo(target.position.x, target.position.y);
          app.stage.addChild(line);
          setTimeout(() => line.destroy(), 100);
        }
      });

      // Update particles
      particles.forEach((p, i) => {
        p.position.x += p.velocity.x;
        p.position.y += p.velocity.y;
        p.life -= 1;
        p.alpha = p.life / 60;
        if (p.life <= 0) {
          app.stage.removeChild(p);
          particles.splice(i, 1);
        }
      });

      // Background nebula effect
      if (Math.random() < 0.01) {
        const nebula = new PIXI.Graphics();
        nebula.beginFill(0x1c2526, 0.1);
        nebula.drawCircle(0, 0, 100);
        nebula.endFill();
        nebula.position.set(Math.random() * app.screen.width, Math.random() * app.screen.height);
        app.stage.addChild(nebula);
        setTimeout(() => nebula.destroy(), 2000);
      }
    });

    // Interaction handling
    app.stage.interactive = true;
    let lastInteraction = 0;
    const handleInteraction = (x, y) => {
      const now = Date.now();
      if (now - lastInteraction < 200) return; // Debounce
      lastInteraction = now;

      // Ripple effect
      const ripple = new PIXI.Graphics();
      ripple.lineStyle(2, 0xffffff, 0.5);
      ripple.drawCircle(0, 0, 10);
      ripple.position.set(x, y);
      app.stage.addChild(ripple);
      let scale = 1;
      const rippleTicker = () => {
        scale += 0.05;
        ripple.scale.set(scale);
        ripple.alpha = 1 - scale / 3;
        if (scale > 3) {
          ripple.destroy();
          app.ticker.remove(rippleTicker);
        }
      };
      app.ticker.add(rippleTicker);

      // Affect nearby entities
      whales.forEach((w) => {
        const dist = Math.hypot(w.position.x - x, w.position.y - y);
        if (dist < 100) {
          w.velocity.x += (w.position.x - x) * 0.05;
          w.velocity.y += (w.position.y - y) * 0.05;
          for (let i = 0; i < 5; i++) createParticle(w.position.x, w.position.y, 0x4b0082);
        }
      });
      jellyfish.forEach((j) => {
        const dist = Math.hypot(j.position.x - x, j.position.y - y);
        if (dist < 100) {
          j.scale.set(1.5);
          for (let i = 0; i < 5; i++) createParticle(j.position.x, j.position.y, 0x00b7eb);
        }
      });
      starships.forEach((s) => {
        const dist = Math.hypot(s.position.x - x, s.position.y - y);
        if (dist < 100) {
          s.velocity.x += (Math.random() - 0.5) * 5;
          s.velocity.y += (Math.random() - 0.5) * 5;
          for (let i = 0; i < 3; i++) createParticle(s.position.x, s.position.y, 0xff4500);
        }
      });
    };

    // Mouse events
    app.stage.on("mousemove", (e) => {
      const { x, y } = e.data.global;
      whales.forEach((w) => {
        const dist = Math.hypot(w.position.x - x, w.position.y - y);
        if (dist < 150) {
          w.velocity.x += (x - w.position.x) * 0.001;
          w.velocity.y += (y - w.position.y) * 0.001;
        }
      });
      jellyfish.forEach((j) => {
        const dist = Math.hypot(j.position.x - x, j.position.y - y);
        if (dist < 150) j.scale.set(1.2);
      });
    });
    app.stage.on("click", (e) => {
      const { x, y } = e.data.global;
      handleInteraction(x, y);
    });

    // Touch events
    app.stage.on("touchmove", (e) => {
      const touch = e.data.getLocalPosition(app.stage);
      whales.forEach((w) => {
        const dist = Math.hypot(w.position.x - touch.x, w.position.y - touch.y);
        if (dist < 150) {
          w.velocity.x += (touch.x - w.position.x) * 0.001;
          w.velocity.y += (touch.y - w.position.y) * 0.001;
        }
      });
      jellyfish.forEach((j) => {
        const dist = Math.hypot(j.position.x - touch.x, j.position.y - touch.y);
        if (dist < 150) j.scale.set(1.2);
      });
    });
    app.stage.on("touchstart", (e) => {
      const touch = e.data.getLocalPosition(app.stage);
      handleInteraction(touch.x, touch.y);
    });

    // Clean up
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`https://project-learn.onrender.com/questions/${skill}`);
        if (res.data.length > 0) {
          setQuestions(res.data);
          setUserAnswers(new Array(res.data.length).fill(null));
        } else {
          setError("No questions available for this skill.");
        }
      } catch (error) {
        setError(`Failed to load quiz: ${error.message}`);
      }
    };
    fetchQuestions();
  }, [skill]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestion] = option;
    setUserAnswers(updatedAnswers);
  };

  const handleNextQuestion = () => {
    if (selectedOption !== null) {
      const isCorrect = selectedOption === questions[currentQuestion].correct_answer;
      setScore((prevScore) => {
        const newScore = isCorrect ? prevScore + 1 : prevScore;
        if (currentQuestion + 1 < questions.length) {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedOption(userAnswers[currentQuestion + 1]);
        } else {
          setShowScore(true);
          submitScore(newScore);
        }
        return newScore;
      });
    } else {
      alert("Please select an option before proceeding.");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(userAnswers[currentQuestion - 1]);
    }
  };

  const submitScore = async (finalScore) => {
    try {
      await axios.post("https://project-learn.onrender.com/submit-score", {
        username,
        skill,
        score: finalScore,
      });
      navigate(`/learning-journey/${skill}`);
    } catch (error) {
      setError("Failed to submit score.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div ref={canvasRef} className="animation-canvas" />
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl w-full mx-auto p-6 bg-gray-900 shadow-lg rounded-lg">
          {showScore ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Your Score: {score} / {questions.length}
              </h2>
              <p className="mt-4 text-gray-300">
                Redirecting to your learning journey... This may take a few moments. Play along with the mouse until then.
              </p>
            </div>
          ) : questions.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Question {currentQuestion + 1}:
              </h2>
              <p className="text-lg mb-4">{questions[currentQuestion].question}</p>
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="mt-2">
                  <input
                    type="radio"
                    id={`option${index}`}
                    name="quiz"
                    value={option}
                    checked={selectedOption === option}
                    onChange={() => handleOptionSelect(option)}
                    className="mr-2"
                  />
                  <label htmlFor={`option${index}`} className="cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
              <div className="mt-6 flex justify-between">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md disabled:opacity-50"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                >
                  Back
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  onClick={handleNextQuestion}
                >
                  {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
                  </div>
                  <p className="mt-4 text-gray-300">Loading quiz...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
