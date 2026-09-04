import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";
import AddJobButton from "./components/AddJobButton";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PostJobPage from "./pages/PostJobPage";
import { useAuth } from "./context/AuthContext";
import "./App.css";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

function MapApp() {
  const [jobs, setJobs] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // Get user location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Default to Ernakulam if denied
        setUserLocation({ lat: 9.9312, lng: 76.2673 });
      }
    );

    // Fetch jobs
    axios.get(`${API_URL}/jobs/`).then((res) => {
      setJobs(res.data.jobs);
    });
  }, []);

  return (
    <div className="app-shell">
      <MapView
        jobs={jobs}
        userLocation={userLocation}
        selectedJob={selectedJob}
        onSelect={setSelectedJob}
      />
      <AddJobButton isLoggedIn={isLoggedIn} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<MapApp />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/signup"   element={<SignupPage />} />
      <Route path="/post-job" element={<PostJobPage />} />
    </Routes>
  );
}
