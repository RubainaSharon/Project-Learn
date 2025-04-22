import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function TakeQuizPrompt() {
  const { skill } = useParams();
  const username = localStorage.getItem("username");
  const [promptShown, setPromptShown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkQuizEligibility = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/can-take-quiz/${username}/${skill}`);
        if (!res.data.can_take) {
          setPromptShown(true);
        } else {
          navigate(`/quiz/${skill}`);
        }
      } catch (err) {
        console.error("Failed to check quiz eligibility", err);
      }
    };

    checkQuizEligibility();
  }, [username, skill, navigate]);

  const handleResponse = (yes) => {
    if (yes) {
      navigate(`/quiz/${skill}?force=true`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center text-center px-4">
      {promptShown && (
        <div className="bg-gray-900 border border-gray-700 p-10 rounded-2xl shadow-lg max-w-xl">
          <h2 className="text-3xl font-bold mb-4">You've already taken the quiz today</h2>
          <p className="text-lg mb-6">
            Do you want to retake it anyway? A new learning journey will be generated.
          </p>
          <div className="space-x-6">
            <button
              onClick={() => handleResponse(true)}
              className="px-6 py-3 bg-black-600 hover:bg-green-700 text-white text-lg rounded-lg"
            >
              Yes, Retake
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="px-6 py-3 bg-black-600 hover:bg-red-700 text-white text-lg rounded-lg"
            >
              No, Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
