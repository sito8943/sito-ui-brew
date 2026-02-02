function Header() {
  return (
    <header className="header">
      <div className="title">Homebrew</div>
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
