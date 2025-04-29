import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UsernamePrompt = ({ setUsername }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect to Home if username already exists
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      navigate("/");
    }
  }, [setUsername, navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`https://project-learn.onrender.com/check-username/${inputUsername}`, {
        timeout: 60000, // Increase timeout to 60 seconds to handle Render spin-up
      });
      if (response.data.exists) {
        setError("Username already exists. Please choose another.");
      } else {
        setUsername(inputUsername);
        localStorage.setItem("username", inputUsername);
        navigate("/");
      }
    } catch (error) {
      setError("Error checking username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-black">Enter your username</h2>
        <input
          type="text"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          className="border p-2 w-full mb-4 text-black"
          disabled={loading}
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
          disabled={loading}
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default UsernamePrompt;
