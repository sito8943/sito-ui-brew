import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Packages from "./views/Packages/Packages";
import View from "./layouts/View";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<View />}>
          <Route index element={<Packages />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
