import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./navbar";
import axios from "axios";
import confetti from "canvas-confetti";
import { FaBars, FaTimes } from "react-icons/fa";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      // ✅ Log the fetched chapters and completion flags
      console.log("Fetched learning journey:", journey);
      console.log("Chapter completion flags:", journey.chapters.map((ch, i) => `Chapter ${i + 1}: ${ch.completed}`));

      const isPlaceholder = journey.chapters.some(
        (chapter) => chapter.script && chapter.script.includes("This is a placeholder script due to API failure")
      );

      if (isPlaceholder) {
        setError("Failed to generate a learning journey due to API issues. Displaying a placeholder journey.");
      } else {
        setError("");
      }

      // ✅ Determine the current chapter to continue from
      const nextIndex = journey.chapters.findIndex(ch => !ch.completed);
      const safeIndex = nextIndex === -1 ? journey.chapters.length - 1 : nextIndex;

      setLearningJourney(journey);
      setCurrentChapterIndex(safeIndex);
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
        setTimeout(() => {
          setShowCelebration(false);
        }, 5000);
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
      setTimeout(() => {
        setGenerateMessage("");
      }, minDelay - timeSinceLastGenerated);
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
      // Use URLSearchParams to properly encode query parameters
      const params = new URLSearchParams({
        username: username,
        skill: skill,
        current_chapter: currentChapterIndex.toString() // Correct parameter name and ensure it's a string
      });
      const url = `https://project-learn.onrender.com/generate-next-chapter?${params.toString()}`;
      console.log('Constructed URL:', url); // Log URL for debugging
      const res = await axios.get(url);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
        <p className="text-xl lg:text-xl text-red-500">🔒 {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16 px-2 pb-6 lg:pt-24 lg:px-4 lg:pb-10">
      <Navbar />
      {/* Header with Toggle Button for Mobile */}
      <header className="bg-gray-900 p-4 flex items-center justify-between sm:hidden mb-4 rounded-lg">
        <h1 className="text-xl font-bold text-purple-400">Chapters</h1>
        <button onClick={toggleSidebar} className="text-2xl text-white">
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </header>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto gap-4 lg:gap-8 relative">
        {/* Sidebar for Chapters */}
        <aside
          className={`custom-scroll w-full sm:w-3/4 lg:w-1/3 bg-gray-900 border border-gray-800 rounded-2xl p-4 lg:p-6 space-y-3 lg:space-y-4 h-auto lg:h-[calc(100vh-7rem)] overflow-y-auto lg:sticky lg:top-28 fixed top-0 left-0 sm:relative transition-transform duration-300 ease-in-out z-10 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
          }`}
          onClick={() => isSidebarOpen && toggleSidebar()}
        >
          <h2 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4 text-center text-purple-400 sm:block hidden">
            Chapters
          </h2>
          {learningJourney.chapters.length > 0 ? (
            learningJourney.chapters.map((ch, i) => {
              const topics = ch.topics?.length ? ch.topics.join(", ") : "Topic A, Topic B, Topic C";
              return (
                <div
                  key={i}
                  className={`p-3 lg:p-4 rounded-lg cursor-pointer transition border hover:border-purple-400 ${
                    i === currentChapterIndex ? "bg-purple-800 text-white" : "bg-gray-800 text-gray-200"
                  }`}
                  onClick={() => setCurrentChapterIndex(i)}
                >
                  <h3 className="text-lg lg:text-xl font-bold">
                    Chapter {ch.chapter || i + 1}: {ch.title || "Untitled"}
                  </h3>
                  <p className="text-xs lg:text-sm mt-1 lg:mt-2 text-gray-300">{topics}</p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 text-sm lg:text-base">No chapters available.</p>
          )}
        </aside>

        {/* Overlay for Mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 sm:hidden z-0"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Main Content */}
        <main className="w-full sm:w-3/4 lg:w-2/3 bg-gray-900 border border-gray-800 rounded-2xl p-6 lg:p-10 shadow-xl mx-auto sm:mx-0">
          {canShow && isUnlocked ? (
            <>
              <h2 className="text-3xl lg:text-4xl font-bold text-blue-300 mb-3 lg:mb-4">
                Chapter {current.chapter || currentChapterIndex + 1}: {current.title || "Untitled"}
              </h2>
              <p className="text-lg lg:text-xl mb-3 lg:mb-4 text-gray-300">{current.description || "No description available."}</p>
              <p className="text-base lg:text-lg mb-3 lg:mb-4">
                Topics:{" "}
                <span className="text-gray-400">
                  {current.topics?.length ? current.topics.join(", ") : "Topic A, Topic B, Topic C"}
                </span>
              </p>
              <div className="text-left">
                <strong className="text-xl lg:text-2xl">Script:</strong>
                <p className="mt-3 lg:mt-4 whitespace-pre-wrap text-base lg:text-lg text-gray-200">
                  {cleanedScript || "No script available."}
                </p>
              </div>
              <p className="mt-4 lg:mt-6 text-base lg:text-lg text-gray-400">
                <strong>Summary:</strong> {current.summary || "No summary available."}
              </p>
              <button
                onClick={() => handleProgressUpdate(currentChapterIndex, !current.completed)}
                className={`mt-4 lg:mt-6 px-4 py-2 lg:px-6 lg:py-3 text-lg lg:text-xl rounded-lg text-white ${
                  current.completed ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={loading}
              >
                {current.completed ? "Mark as Incomplete" : "Mark as Completed"}
              </button>
              {current.completed && currentChapterIndex + 1 < learningJourney.chapters.length && (
                <div className="mt-4 lg:mt-6">
                  <button
                    onClick={generateNextChapter}
                    className={`mt-2 lg:mt-4 ml-0 lg:ml-4 px-4 py-2 lg:px-6 lg:py-3 text-base lg:text-lg rounded-lg text-white ${
                      loading || generateMessage ? "bg-gray-600 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                    }`}
                    disabled={loading || generateMessage}
                  >
                    Generate Next Chapter
                  </button>
                  {loading && (
                    <p className="mt-2 lg:mt-3 text-xs lg:text-sm text-gray-400">⏳ Please wait, the chapter is being generated...</p>
                  )}
                  {generateMessage && (
                    <p className="mt-2 lg:mt-3 text-xs lg:text-sm text-yellow-400">{generateMessage}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-lg lg:text-xl text-yellow-400">🔒 Complete the previous chapters to unlock this.</p>
          )}
        </main>
      </div>

      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-3 lg:mb-4 animate-bounce">
              Yay! You've completed the course!
            </h2>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-4 lg:mt-6 px-4 py-2 lg:px-6 lg:py-3 bg-purple-600 hover:bg-purple-700 text-base lg:text-lg rounded-lg text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
