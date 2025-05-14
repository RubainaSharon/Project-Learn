import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function LearningJourney() {
  const { skillName } = useParams();
  const [learningJourney, setLearningJourney] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [lastGeneratedTime, setLastGeneratedTime] = useState(null);

  useEffect(() => {
    const fetchJourney = async () => {
      const username = localStorage.getItem("username");
      try {
        const res = await axios.get(
          `https://project-learn.onrender.com/learning-journey/${username}/${skillName}`
        );
        const journey = res.data;

        setLearningJourney(journey);
        setLastGeneratedTime(Date.now());

        // Resume from last completed chapter
        const lastCompletedIndex = journey.chapters.reduce(
          (acc, ch, idx) => (ch.completed ? idx : acc),
          0
        );
        setCurrentChapterIndex(lastCompletedIndex);
      } catch (err) {
        console.error("Failed to load learning journey:", err);
      }
    };

    fetchJourney();
  }, [skillName]);

  if (!learningJourney) return <div className="text-white p-8">Loading...</div>;

  const currentChapter = learningJourney.chapters[currentChapterIndex];

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold text-center mb-10">
        {learningJourney.skill} Learning Journey
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar with chapter list */}
        <div className="col-span-1 bg-gray-900 p-6 rounded-2xl">
          <h2 className="text-2xl font-semibold mb-4">Chapters</h2>
          <ul className="space-y-3">
            {learningJourney.chapters.map((chapter, idx) => {
              const isUnlocked = idx <= currentChapterIndex;
              return (
                <li key={idx}>
                  <button
                    disabled={!isUnlocked}
                    className={`w-full text-left px-4 py-2 rounded-xl transition ${
                      idx === currentChapterIndex
                        ? "bg-green-600 text-white"
                        : isUnlocked
                        ? "bg-gray-800 hover:bg-gray-700 text-white"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => isUnlocked && setCurrentChapterIndex(idx)}
                  >
                    {chapter.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Current chapter content */}
        <div className="col-span-3 bg-gray-900 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">{currentChapter.title}</h2>
          <p className="text-lg mb-6">{currentChapter.content}</p>

          {!currentChapter.completed && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
              onClick={() => {
                const updatedJourney = { ...learningJourney };
                updatedJourney.chapters[currentChapterIndex].completed = true;
                setLearningJourney(updatedJourney);

                // Move to next chapter if not last
                if (currentChapterIndex < updatedJourney.chapters.length - 1) {
                  setCurrentChapterIndex(currentChapterIndex + 1);
                }
              }}
            >
              Mark Chapter as Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
