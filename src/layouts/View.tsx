import { Outlet } from "react-router-dom";

// components
import { Footer, Header, Main } from "../components";
import { SelectedPackageProvider } from "../context/SelectedPackageContext";
import PackageDrawer from "../components/Package/PackageDrawer";
import { SearchProvider } from "../context/SearchContext";

function View() {
  return (
    <SearchProvider>
      <SelectedPackageProvider>
        <Header />
        <Main>
          <Outlet />
        </Main>
        <Footer />
        {/* Global drawer, uses context */}
        <PackageDrawer />
      </SelectedPackageProvider>
    </SearchProvider>
  );
}

export default View;
