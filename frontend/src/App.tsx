import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext";
import { AppLayout } from "./components/AppLayout";
import Home from "./pages/Home";
import Results from "./pages/Results";
import ProductDetails from "./pages/ProductDetails";
import Compare from "./pages/Compare";

export default function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="results" element={<Results />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="compare" element={<Compare />} />
          </Route>
        </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}
