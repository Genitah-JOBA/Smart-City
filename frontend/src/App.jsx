import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Signalements from "./Signalements";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signalement" element={<Signalements />} />
        <Route path="/" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
