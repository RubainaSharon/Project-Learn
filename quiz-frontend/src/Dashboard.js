import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./navbar";

const Dashboard = ({ username }) => {
  const [userData, setUserData] = useState({ skills: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`https://project-learn.onrender.com/user-data/${username}`);
        setUserData(res.data); // Line 13: Ensure proper syntax
        setLoading(false);
      } catch (err) {
        setError("Failed to load user data.");
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard for {username}</h1>
        {userData.skills.length > 0 ? (
          <div className="space-y-4">
            {userData.skills.map((skillData, index) => (
              <div key={index} className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-semibold">{skillData.skill}</h2>
                <p>Score: {skillData.score}</p>
                <p>Progress: {skillData.progress}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No skills data available. Start learning to see your progress!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
