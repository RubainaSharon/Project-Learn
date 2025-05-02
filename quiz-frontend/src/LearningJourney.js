import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./navbar";
import axios from "axios";
import confetti from "canvas-confetti";
import { FaBook, FaFileAlt } from "react-icons/fa"; // Icons for toggle buttons

export default function LearningJourney() {
  const { skill } = useParams();
  const username = localStorage.getItem("username");
  const [learningJourney, setLearningJourney] = useState({ chapters: [] });
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastGeneratedTime, setLastGeneratedTime] = useState(null);
  const [generateMessage, setGenerateMessage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showScript, setShowScript] = useState(false); // Toggle state for mobile

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`https://project-learn.onrender.com/user-data/${username}`);
        const skillData = res.data.skills.find((s) => s.skill.toLowerCase() === skill.toLowerCase());
        if (!skillData || !skillData.learning_journey) {
          throw new Error("No learning journey found for this skill.");
        }
        const journey = skillData.learning_journey;
        const isPlaceholder = journey.chapters.some(
          (chapter) => chapter.script && chapter.script.includes("This is a placeholder script due to API failure")
        );
        if (isPlaceholder) {
          setError("Failed to generate a learning journey due to API issues. Displaying a placeholder journey.");
        } else {
          setError("");
        }
        setLearningJourney(journey);
        setLastGeneratedTime(Date.now());
      } catch (err) {
        console.error("Failed to fetch learning journey", err);
        setError(err.message || "Failed to load learning journey. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (username && skill) {
      fetchJourney();
    } else {
      setError("User or skill not specified.");
      setLoading(false);
    }
  }, [skill, username]);

  const handleProgressUpdate = async (index, completed) => {
    try {
      await axios.post("https://project-learn.onrender.com/update-progress", {
        username,
        skill,
        chapter_index: index,
        completed,
      });
      const updated = { ...learningJourney };
      updated.chapters[index].completed = completed;
      setLearningJourney(updated);
      if (index === 9 && completed) {
        setShowCelebration(true);
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
          duration: 3000,
        });
        setTimeout(() => setShowCelebration(false), 5000);
      }
    } catch (err) {
      console.error("Failed to update progress", err);
      setError("Failed to update progress. Please try again.");
    }
  };

  const generateNextChapter = async () => {
    const now = Date.now();
    const timeSinceLastGenerated = lastGeneratedTime ? now - lastGeneratedTime : Infinity;
    const minDelay = 60 * 1000;
    if (timeSinceLastGenerated < minDelay) {
      setGenerateMessage(
        `Can be generated only after a minute. Read this chapter first. (${Math.ceil(
          (minDelay - timeSinceLastGenerated) / 1000
        )}s remaining)`
      );
      setTimeout(() => setGenerateMessage(""), minDelay - timeSinceLastGenerated);
      return;
    }
    const nextIndex = currentChapterIndex + 1;
    if (nextIndex >= learningJourney.chapters.length) {
      setError("No more chapters to generate.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `https://project-learn.onrender.com/generate-next-chapter?username=${username}&skill=${skill}&current_chapter=${currentChapterIndex}`
      );
      const updated = { ...learningJourney };
      updated.chapters[nextIndex] = res.data;
      setLearningJourney(updated);
      setCurrentChapterIndex(nextIndex);
      setLastGeneratedTime(now);
      setGenerateMessage("");
    } catch (err) {
      console.error("Failed to generate next chapter", err);
      setError("Failed to generate next chapter. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const current = learningJourney.chapters[currentChapterIndex] || {};
  const isUnlocked = !!current.script || currentChapterIndex === 0;
  const canShow = currentChapterIndex === 0 || learningJourney.chapters[currentChapterIndex - 1]?.completed;
  const cleanedScript =
    currentChapterIndex === 0 && current.script
      ? current.script.replace(/\*\*/g, "").replace(/#/g, "").replace(/"/g, "").trim()
      : current.script;

  if (loading && !generateMessage) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error && !generateMessage) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16 px-2 sm:px-4 lg:px-6 pb-4">
      <Navbar />
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto gap-4">
        {/* Toggle Buttons for Mobile */}
        <div className="lg:hidden flex justify-around mb-4">
          <button
            onClick={() => setShowScript(false)}
            className={`px-4 py-2 text-lg rounded-lg flex items-center gap-2 ${
              !showScript ? "bg-purple-600 text-white" : "bg-gray-600 text-gray-300"
            }`}
          >
            <FaBook /> Chapters
          </button>
          <button
            onClick={() => setShowScript(true)}
            className={`px-4 py-2 text-lg rounded-lg flex items-center gap-2 ${
              showScript ? "bg-purple-600 text-white" : "bg-gray-600 text-gray-300"
            }`}
            disabled={!isUnlocked || !canShow}
          >
            <FaFileAlt /> Script
          </button>
        </div>

        {/* Sidebar (Chapters) - Hidden on mobile when script is shown */}
        <aside
          className={`custom-scroll w-full lg:w-1/3 bg-gray-900 border border-gray-800 rounded-2xl p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 h-[calc(100vh-6rem)] overflow-y-auto sticky top-20 ${
            showScript && "hidden lg:block"
          }`}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-center text-purple-400">
            Chapters
          </h2>
          {learningJourney.chapters.length > 0 ? (
            learningJourney.chapters.map((ch, i) => {
              const topics = ch.topics?.length ? ch.topics.join(", ") : "Topic A, Topic B, Topic C";
              return (
                <div
                  key={i}
                  className={`p-2 sm:p-3 rounded-lg cursor-pointer transition border hover:border-purple-400 ${
                    i === currentChapterIndex ? "bg-purple-800 text-white" : "bg-gray-800 text-gray-200"
                  }`}
                  onClick={() => {
                    setCurrentChapterIndex(i);
                    setShowScript(true); // Show script on mobile when a chapter is selected
                  }}
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                    Chapter {ch.chapter || i + 1}: {ch.title || "Untitled"}
                  </h3>
                  <p className="text-sm sm:text-base mt-1 text-gray-300">{topics}</p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 text-sm sm:text-base">No chapters available.</p>
          )}
        </aside>

        {/* Main Content (Script) - Hidden on mobile when chapters are shown */}
        <main
          className={`w-full lg:w-2/3 bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 lg:p-10 shadow-xl ${
            !showScript && "hidden lg:block"
          }`}
        >
          {canShow && isUnlocked ? (
            <>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-300 mb-2 sm:mb-3">
                Chapter {current.chapter || currentChapterIndex + 1}: {current.title || "Untitled"}
              </h2>
              <p className="text-lg sm:text-xl mb-2 sm:mb-3 text-gray-300">
                {current.description || "No description available."}
              </p>
              <p className="text-base sm:text-lg mb-2 sm:mb-3">
                Topics:{" "}
                <span className="text-gray-400">
                  {current.topics?.length ? current.topics.join(", ") : "Topic A, Topic B, Topic C"}
                </span>
              </p>
              <div className="text-left">
                <strong className="text-xl sm:text-2xl">Script:</strong>
                <p className="mt-2 sm:mt-3 whitespace-pre-wrap text-base sm:text-lg text-gray-200">
                  {cleanedScript || "No script available."}
                </p>
              </div>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-400">
                <strong>Summary:</strong> {current.summary || "No summary available."}
              </p>
              <button
                onClick={() => handleProgressUpdate(currentChapterIndex, !current.completed)}
                className={`mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 text-lg sm:text-xl rounded-lg text-white ${
                  current.completed ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={loading}
              >
                {current.completed ? "Mark as Incomplete" : "Mark as Completed"}
              </button>
              {current.completed && currentChapterIndex + 1 < learningJourney.chapters.length && (
                <div className="mt-4 sm:mt-6">
                  <button
                    onClick={generateNextChapter}
                    className={`mt-2 sm:mt-4 ml-0 sm:ml-4 px-4 sm:px-6 py-2 sm:py-3 text-lg sm:text-xl rounded-lg text-white ${
                      loading || generateMessage
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                    disabled={loading || generateMessage}
                  >
                    Generate Next Chapter
                  </button>
                  {loading && (
                    <p className="mt-2 text-sm sm:text-base text-gray-400">
                      ⏳ Please wait, the chapter is being generated...
                    </p>
                  )}
                  {generateMessage && (
                    <p className="mt-2 text-sm sm:text-base text-yellow-400">{generateMessage}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-lg sm:text-xl text-yellow-400">
              🔒 Complete the previous chapters to unlock this.
            </p>
          )}
        </main>
      </div>
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 animate-bounce">
              Yay! You've completed the course!
            </h2>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white text-lg sm:text-xl rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
