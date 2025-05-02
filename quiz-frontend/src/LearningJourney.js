import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./navbar";
import axios from "axios";
import confetti from "canvas-confetti";
import { FaLock, FaCheckCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";

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
  const [expandedChapter, setExpandedChapter] = useState(null); // for mobile accordion

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

  const generateNextChapter = async (index) => {
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
    const nextIndex = index + 1;
    if (nextIndex >= learningJourney.chapters.length) {
      setError("No more chapters to generate.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `https://project-learn.onrender.com/generate-next-chapter?username=${username}&skill=${skill}&current_chapter=${index}`
      );
      const updated = { ...learningJourney };
      updated.chapters[nextIndex] = res.data;
      setLearningJourney(updated);
      setLastGeneratedTime(now);
      setGenerateMessage("");
    } catch (err) {
      console.error("Failed to generate next chapter", err);
      setError("Failed to generate next chapter. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Mobile Layout: Accordion Style */}
      <div className="lg:hidden max-w-3xl mx-auto space-y-4 mt-4">
        <h2 className="text-2xl font-bold text-purple-400 text-center">Your Learning Journey</h2>
        {learningJourney.chapters.map((ch, i) => {
          const isUnlocked = i === 0 || learningJourney.chapters[i - 1]?.completed;
          const isExpanded = expandedChapter === i;
          const cleanedScript = ch.script?.replace(/\*\*/g, "").replace(/#/g, "").replace(/"/g, "").trim();
          return (
            <div
              key={i}
              className={`rounded-xl border border-gray-700 p-4 transition ${
                isUnlocked ? "bg-gray-800" : "bg-gray-900 opacity-60"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => isUnlocked && setExpandedChapter(isExpanded ? null : i)}
              >
                <div>
                  <h3 className="text-lg font-bold">
                    Chapter {ch.chapter || i + 1}: {ch.title || "Untitled"}
                  </h3>
                  <p className="text-sm text-gray-400">{ch.topics?.join(", ") || "Topics loading..."}</p>
                </div>
                <div className="text-xl">
                  {!isUnlocked ? (
                    <FaLock title="Locked" className="text-red-500" />
                  ) : isExpanded ? (
                    <FaChevronUp />
                  ) : (
                    <FaChevronDown />
                  )}
                </div>
              </div>

              {isExpanded && isUnlocked && (
                <div className="mt-4 text-sm text-gray-300">
                  <p className="mb-2">{ch.description || "No description available."}</p>
                  <p className="mb-2">
                    <strong>Script:</strong>
                    <br />
                    <span className="whitespace-pre-wrap">{cleanedScript || "No script available."}</span>
                  </p>
                  <p className="mb-2">
                    <strong>Summary:</strong> {ch.summary || "No summary available."}
                  </p>
                  <button
                    onClick={() => handleProgressUpdate(i, !ch.completed)}
                    className={`mt-2 w-full py-2 rounded-lg text-white text-sm font-semibold ${
                      ch.completed ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {ch.completed ? "Mark as Incomplete" : "Mark as Completed"}
                  </button>
                  {ch.completed && i + 1 < learningJourney.chapters.length && (
                    <button
                      onClick={() => generateNextChapter(i)}
                      disabled={loading || generateMessage}
                      className={`mt-2 w-full py-2 rounded-lg text-white text-sm font-semibold ${
                        loading || generateMessage ? "bg-gray-600 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      Generate Next Chapter
                    </button>
                  )}
                  {generateMessage && <p className="mt-2 text-yellow-400 text-xs">{generateMessage}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Web Layout: Original Version */}
      <div className="hidden lg:flex flex-col lg:flex-row max-w-7xl mx-auto gap-4">
        {/* Sidebar */}
        <aside className="custom-scroll w-1/3 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 h-[calc(100vh-6rem)] overflow-y-auto sticky top-20">
          <h2 className="text-2xl font-bold mb-3 text-center text-purple-400">Chapters</h2>
          {learningJourney.chapters.map((ch, i) => {
            const topics = ch.topics?.length ? ch.topics.join(", ") : "Topic A, Topic B, Topic C";
            return (
              <div
                key={i}
                className={`p-3 rounded-lg cursor-pointer transition border hover:border-purple-400 ${
                  i === currentChapterIndex ? "bg-purple-800 text-white" : "bg-gray-800 text-gray-200"
                }`}
                onClick={() => setCurrentChapterIndex(i)}
              >
                <h3 className="text-xl font-bold">
                  Chapter {ch.chapter || i + 1}: {ch.title || "Untitled"}
                </h3>
                <p className="text-sm mt-1 text-gray-300">{topics}</p>
              </div>
            );
          })}
        </aside>

        {/* Main Script */}
        <main className="w-2/3 bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-xl">
          {learningJourney.chapters[currentChapterIndex] ? (
            <>
              <h2 className="text-3xl font-bold text-blue-300 mb-3">
                Chapter {learningJourney.chapters[currentChapterIndex].chapter || currentChapterIndex + 1}:{" "}
                {learningJourney.chapters[currentChapterIndex].title || "Untitled"}
              </h2>
              <p className="text-xl mb-3 text-gray-300">
                {learningJourney.chapters[currentChapterIndex].description || "No description available."}
              </p>
              <p className="text-lg mb-3">
                Topics:{" "}
                <span className="text-gray-400">
                  {learningJourney.chapters[currentChapterIndex].topics?.join(", ") || "No topics listed"}
                </span>
              </p>
              <div className="text-left">
                <strong className="text-2xl">Script:</strong>
                <p className="mt-3 whitespace-pre-wrap text-lg text-gray-200">
                  {learningJourney.chapters[currentChapterIndex].script?.replace(/\*\*/g, "").replace(/#/g, "") ||
                    "No script available."}
                </p>
              </div>
              <p className="mt-6 text-lg text-gray-400">
                <strong>Summary:</strong> {learningJourney.chapters[currentChapterIndex].summary || "No summary available."}
              </p>
              <button
                onClick={() =>
                  handleProgressUpdate(currentChapterIndex, !learningJourney.chapters[currentChapterIndex].completed)
                }
                className={`mt-6 px-6 py-3 text-xl rounded-lg text-white ${
                  learningJourney.chapters[currentChapterIndex].completed
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {learningJourney.chapters[currentChapterIndex].completed ? "Mark as Incomplete" : "Mark as Completed"}
              </button>
              {learningJourney.chapters[currentChapterIndex].completed &&
                currentChapterIndex + 1 < learningJourney.chapters.length && (
                  <div className="mt-6">
                    <button
                      onClick={() => generateNextChapter(currentChapterIndex)}
                      className={`px-6 py-3 text-xl rounded-lg text-white ${
                        loading || generateMessage
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                      disabled={loading || generateMessage}
                    >
                      Generate Next Chapter
                    </button>
                    {generateMessage && <p className="mt-2 text-yellow-400 text-sm">{generateMessage}</p>}
                  </div>
                )}
            </>
          ) : (
            <p className="text-lg text-yellow-400">🔒 Complete the previous chapters to unlock this.</p>
          )}
        </main>
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white mb-4 animate-bounce">
              🎉 Yay! You've completed the course!
            </h2>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xl rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
