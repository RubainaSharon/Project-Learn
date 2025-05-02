import { Link } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa"; // For hamburger and close icons

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  const scrollToSkills = () => {
    const skillSection = document.getElementById("skills");
    if (skillSection) skillSection.scrollIntoView({ behavior: "smooth" });
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  return (
    <nav className="bg-black text-white w-full py-4 fixed top-0 shadow-lg z-50 border-b border-gray-800">
      {/* Hamburger Icon for Mobile */}
      <div className="sm:hidden flex items-center justify-between px-4">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-3xl">
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <span className="text-2xl font-bold">Learn</span>
      </div>

      {/* Sidebar for Mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out sm:hidden z-50`}
      >
        <div className="flex flex-col items-center py-6 space-y-6">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="self-end mr-4 text-2xl text-white hover:text-purple-400"
          >
            <FaTimes />
          </button>
          <ul className="flex flex-col space-y-6 text-2xl font-bold items-center">
            <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
              <Link to="/" onClick={scrollToTop}>Home</Link>
            </li>
            <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
              <Link to="/" onClick={scrollToSkills}>Skills</Link>
            </li>
            <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
              <Link to="/about" onClick={() => setIsSidebarOpen(false)}>About</Link>
            </li>
            <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
              <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)}>Dashboard</Link>
            </li>
            <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
              <Link to="/profile" onClick={() => setIsSidebarOpen(false)}>
                Profile
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay for sidebar when open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 sm:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Regular Navbar for Desktop */}
      <div className="hidden sm:flex justify-center">
        <ul className="flex flex-row space-x-6 md:space-x-20 text-2xl sm:text-3xl md:text-4xl font-bold items-center p-2">
          <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
            <Link to="/" onClick={scrollToTop}>Home</Link>
          </li>
          <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
            <Link to="/" onClick={scrollToSkills}>Skills</Link>
          </li>
          <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
            <Link to="/about">About</Link>
          </li>
          <li className="transition duration-300 ease-in-out hover:text-purple-400 hover:underline underline-offset-8">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="ml-0 sm:ml-6">
            <Link to="/profile" title="Profile">
              <svg className="w-8 sm:w-10 h-8 sm:h-10 text-white hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
