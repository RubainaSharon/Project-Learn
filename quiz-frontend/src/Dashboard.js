import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./navbar";
import { Link } from "react-router-dom";

const Dashboard = ({ username }) => {
  const [userData, setUserData] = useState({ skills: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`https://project-learn.onrender.com/user-data/${username}`);
        setUserData(res.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load user data. Please try again later.");
        setLoading(false);
      }
    };
    if (username) {
      fetchData();
    } else {
      setError("Username not found. Please log in again.");
      setLoading(false);
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-purple-400">Dashboard for {username}</h1>
        {userData.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userData.skills.map((skillData, index) => (
              <div key={index} className="p-4 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-blue-300">{skillData.skill}</h2>
                <p className="mt-2">Score: {skillData.score}/20</p>
                <p>Progress: {skillData.progress.toFixed(1)}%</p>
                <p className="text-gray-400 text-sm mt-1">
                  Last Attempt: {skillData.last_attempt_date || "N/A"}
                </p>
                <Link
                  to={`/learning-journey/${encodeURIComponent(skillData.skill)}`}
                  className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                >
                  View Learning Journey
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">
            No skills data available. Start learning by taking a quiz from the{" "}
            <Link to="/" className="text-purple-400 hover:underline">
              Home page
            </Link>
            !
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
