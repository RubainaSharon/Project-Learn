import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const fetchSkills = async () => {
      const username = localStorage.getItem("username");
      try {
        const res = await axios.get(`https://project-learn.onrender.com/user-data/${username}`);
        setSkills(res.data.skills || []);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchSkills();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-20 px-6">
      <h1 className="text-5xl font-extrabold mb-12 text-center">Your Dashboard</h1>
      <div className="w-full max-w-5xl grid grid-cols-1 gap-8">
        {skills.map((skill, index) => {
          const chapters = skill.learning_journey?.chapters || [];
          const completed = chapters.filter((ch) => ch.completed).length;
          const progress = chapters.length > 0 ? (completed / chapters.length) * 100 : 0;

          return (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 p-10 rounded-3xl text-center shadow-xl hover:scale-105 transform transition"
            >
              <h2 className="text-4xl font-bold text-purple-400 mb-2">{skill.skill}</h2>
              <p className="text-xl">Score: {skill.score}</p>
              <p className="text-lg">Level: {skill.learning_journey.level}</p>
              <p className="text-lg">Progress: {progress.toFixed(2)}%</p>
              <Link
                to={`/learning-journey/${skill.skill}`}
                className="mt-4 inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-xl rounded-xl transition"
              >
                Continue Learning
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
