const Navbar = () => {

  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-end px-6 py-3 bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] border-b-4 border-black shadow-[0_4px_0px_#ff2e63] font-retro z-50">
      <button
        className="p-2 bg-[#f7d716] border-4 border-black rounded-full hover:bg-yellow-400 active:scale-95 transition-transform"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-black"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 16c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
        </svg>
      </button>
    </nav>
  )
}

export default Navbar
