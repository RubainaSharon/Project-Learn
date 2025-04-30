import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./navbar";

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
    <div className="min-h-screen bg-black text-white">
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
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
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
