import { Outlet } from "react-router-dom";

// components
import { Footer, Header, Main } from "../components";
import { SelectedPackageProvider } from "../context/SelectedPackageContext";
import PackageDrawer from "../components/Package/PackageDrawer";

function View() {
  return (
    <SelectedPackageProvider>
      <Header />
      <Main>
        <Outlet />
      </Main>
      <Footer />
      {/* Global drawer, uses context */}
      <PackageDrawer />
    </SelectedPackageProvider>
  );
}

export default View;
