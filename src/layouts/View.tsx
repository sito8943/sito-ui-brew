import { Outlet } from "react-router-dom";

// components
import { Footer, Header, Main } from "../components";

function View() {
  return (
    <>
      <Header />
      <Main>
        <Outlet />
      </Main>
      <Footer />
    </>
  );
}

export default View;
