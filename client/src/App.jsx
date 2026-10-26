import { BrowserRouter, Link, Route, Routes } from "react-router";
import Layout from "./components/Layout.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PlayPage from "./pages/PlayPage.jsx";
import SuggestPage from "./pages/SuggestPage.jsx";

function NotFoundPage() {
  return (
    <section className="flex flex-col gap-4 pt-10">
      <h1 className="text-4xl font-extrabold">This track goes nowhere.</h1>
      <Link to="/" className="font-semibold underline underline-offset-4">
        Back to the start
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/suggest" element={<SuggestPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
