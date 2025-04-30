import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import axios from "axios";

export default function Profile() {
  const username = localStorage.getItem("username");
  const [userSkills, setUserSkills] = useState([]);
  const [notes, setNotes] = useState(localStorage.getItem("userNotes") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`https://project-learn.onrender.com/user-data/${username}`);
        const skills = res.data.skills || [];
        setUserSkills(skills);
      } catch (err) {
        console.error("Failed to fetch user data", err);
        setError("Failed to load profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserData();
    } else {
      setError("Username not found.");
      setLoading(false);
    }
  }, [username]);

  // Save notes to localStorage on change
  const handleNotesChange = (content) => {
    setNotes(content);
    localStorage.setItem("userNotes", content);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-start px-6 pt-24 pb-10">
      <navbar /> {/* Assuming Navbar is available; adjust if needed */}
      <div className="max-w-4xl w-full mx-auto">
        <h1 className="text-6xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 animate-fade-in">
          Welcome, {username}!
        </h1>
        <p className="text-2xl mb-12 text-center text-gray-300">Explore your learning journey.</p>
        <Link
          to="/dashboard"
          className="px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white text-2xl rounded-xl transition mb-12 block text-center"
        >
          Go to Dashboard
        </Link>

        {/* Scores Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-purple-400 pb-2 text-center">
            Your Achievements
          </h2>
          {userSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userSkills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-6 rounded-lg shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-delay"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <h3 className="text-xl font-semibold text-purple-300">{skill.skill}</h3>
                  <p className="text-gray-400">Score: {skill.score || 0}/20</p>
                  <p className="text-gray-400">Progress: {skill.progress.toFixed(1)}%</p>
                  <p className="text-gray-400">
                    Last Attempt: {skill.last_attempt_date || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">No skills attempted yet.</p>
          )}
        </section>

        {/* Notes Section */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-blue-400 pb-2 text-center">
            Your Notes
          </h2>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <ReactQuill
              value={notes}
              onChange={handleNotesChange}
              placeholder="Write your notes here... (unlimited space!)"
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic", "underline", "strike"],
                  ["link", "image"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["clean"],
                ],
              }}
              className="custom-quill-editor text-white" // Custom class for styling
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// Animation keyframes and custom Quill styling
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeInDelay {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  .animate-fade-in-delay {
    animation: fadeInDelay 0.5s ease-in-out forwards;
  }
  .custom-quill-editor .ql-editor {
    color: white !important; /* Force white text color */
    background-color: #2d3748; /* Match bg-gray-800 for consistency */
  }
  .custom-quill-editor .ql-toolbar {
    background-color: #2d3748; /* Match bg-gray-800 */
    border-color: #4a5568; /* Lighter border for contrast */
  }
  .custom-quill-editor .ql-container {
    border-color: #4a5568; /* Lighter border for contrast */
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
