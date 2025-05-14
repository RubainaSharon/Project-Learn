import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import "./Quiz.css";

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
  const [showPopup, setShowPopup] = useState(false); // State for custom popup

  // Fetch questions for the selected skill
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

  // Spotlight effect: Update --mouse-x and --mouse-y CSS variables
  useEffect(() => {
    const updatePosition = (clientX, clientY) => {
      const quizBg = document.querySelector(".quiz-bg");
      if (quizBg) {
        const { width, height } = quizBg.getBoundingClientRect();
        const xPercent = (clientX / width) * 100;
        const yPercent = (clientY / height) * 100;
        quizBg.style.setProperty("--mouse-x", `${xPercent}%`);
        quizBg.style.setProperty("--mouse-y", `${yPercent}%`);
      }
    };

    const handleMouseMove = (e) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling while dragging
      if (e.touches && e.touches.length > 0) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

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
      setShowPopup(true); // Show custom popup instead of alert
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background with spotlight effect */}
      <div className="quiz-bg"></div>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        {showScore ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Your Score: {score} / {questions.length}
            </h2>
            <p className="mt-4 text-gray-300 text-xl">
              AI is creating your Learning Journey based on the score... This may take a few moments. Try to find out who is in the background until then.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl w-full mx-auto p-6 bg-gray-900 shadow-lg rounded-lg relative z-10">
            {questions.length > 0 ? (
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
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
            <p className="text-lg text-white mb-4">
              Please select an option to continue.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
