import { Link } from "react-router-dom";

export default function Navbar() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToSkills = () => {
    const skillSection = document.getElementById("skills");
    if (skillSection) skillSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="bg-black text-white w-full py-6 fixed top-0 flex justify-center shadow-lg z-50 border-b border-gray-800">
      <ul className="flex space-x-20 text-4xl font-bold items-center">
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
        <li className="ml-6">
          <Link to="/profile" title="Profile">
            <svg className="w-10 h-10 text-white hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
