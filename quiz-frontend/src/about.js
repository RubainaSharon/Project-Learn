import React from "react";
import Navbar from "./navbar";

const About = ({ username }) => {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center">
      <Navbar username={username} />
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-6xl font-extrabold">About This Project</h2>
        <p className="text-2xl mt-6 max-w-2xl text-center">
          Welcome to our interactive learning platform! This website is designed to help you explore and test your
          knowledge in various fields, including programming, technology, business skills, and soft skills. With
          engaging quizzes and interactive content, we aim to make learning fun and effective. Choose a skill, take a
          quiz, and track your progress as you go!
        </p>
      </div>
    </div>
  );
};

export default About;