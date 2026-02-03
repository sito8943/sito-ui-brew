function Header() {
  return (
    <header className="flex justify-between items-center p-4 backdrop-blur-md sticky top-0 z-10 bg-primary/30 border-b border-gray-200">
      <h1 className="text-xl">Homebrew</h1>
      <div className="search">
        {/* <input
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          placeholder="Search installed packages"
        /> */}
      </div>
    </header>
  );
}

export default Header;
