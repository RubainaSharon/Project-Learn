import React from "react";
import Navbar from "./navbar";

const About = ({ username }) => {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Navbar username={username} />
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-10 text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-purple-400">
          About This Project
        </h2>
        <p className="text-base sm:text-lg md:text-2xl max-w-2xl text-gray-300">
          Welcome to our interactive learning platform! This website is designed to help you explore and test your
          knowledge in various fields including programming, technology, business skills, and soft skills.
          <br className="hidden sm:block" />
          <br />
          With engaging quizzes and interactive content, we aim to make learning fun and effective. Choose a skill,
          take a quiz, and track your progress as you go!
        </p>
      </div>
    </div>
  );
};

export default About;
