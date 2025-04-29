import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UsernamePrompt = ({ setUsername }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [error, setError] = useState("");
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
    try {
      const response = await axios.get(`https://Project-Learn.onrender.com/check-username/${inputUsername}`);
      if (response.data.exists) {
        setError("Username already exists. Please choose another.");
      } else {
        setUsername(inputUsername);
        localStorage.setItem("username", inputUsername);
        navigate("/");
      }
    } catch (error) {
      setError("Error checking username.");
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
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default UsernamePrompt;
