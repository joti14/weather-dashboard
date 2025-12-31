import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentCities, setRecentCities] = useState([]);

  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const saved = localStorage.getItem("recentCities");
    if (saved) setRecentCities(JSON.parse(saved));
  }, []);

  const getWeatherIcon = (main) => {
    switch (main?.toLowerCase()) {
      case "clear":
        return "☀️";
      case "clouds":
        return "☁️";
      case "rain":
      case "drizzle":
        return "🌧️";
      case "snow":
        return "❄️";
      case "thunderstorm":
        return "⛈️";
      case "mist":
      case "fog":
      case "haze":
        return "🌫️";
      default:
        return "🌤️";
    }
  };

  const getBgClass = (temp) => {
    if (!temp) return "";
    if (temp < 10) return "cold";
    if (temp < 20) return "cool";
    if (temp < 30) return "warm";
    return "hot";
  };

  const getAqiInfo = (aqiValue) => {
    switch (aqiValue) {
      case 1:
        return {
          label: "Good",
          color: "#00e400",
          desc: "Air quality is satisfactory.",
        };
      case 2:
        return {
          label: "Fair",
          color: "#ffff00",
          desc: "Air quality is acceptable.",
        };
      case 3:
        return {
          label: "Moderate",
          color: "#ff7e00",
          desc: "Sensitive groups may experience effects.",
        };
      case 4:
        return {
          label: "Poor",
          color: "#ff0000",
          desc: "Everyone may experience health effects.",
        };
      case 5:
        return {
          label: "Very Poor",
          color: "#8f3f97",
          desc: "Health warnings of emergency conditions.",
        };
      default:
        return { label: "Unknown", color: "#gray", desc: "" };
    }
  };

  const handleSearch = async (searchCity = city) => {
    // Fix: Ensure searchCity is a string before trimming
    const cityToSearch = (searchCity || "").toString().trim();

    if (!cityToSearch) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setAqi(null);

    try {
      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityToSearch}&appid=${API_KEY}&units=metric`
      );

      const weatherData = weatherRes.data;
      setWeather(weatherData);

      // Update recent cities (case-insensitive unique)
      const newRecents = [
        cityToSearch,
        ...recentCities.filter(
          (c) => c.toLowerCase() !== cityToSearch.toLowerCase()
        ),
      ].slice(0, 3);
      setRecentCities(newRecents);
      localStorage.setItem("recentCities", JSON.stringify(newRecents));

      // Set input field to searched city
      setCity(cityToSearch);

      const { lat, lon } = weatherData.coord;
      const aqiRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      setAqi(aqiRes.data.list[0].main.aqi);
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      setError("City not found or API key issue. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app ${getBgClass(weather?.main.temp)}`}>
      <div className="card">
        <h1>Weather & Air Quality Dashboard</h1>

        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name (e.g. London)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? "⟳" : "Search"}
          </button>
        </div>

        {recentCities.length > 0 && (
          <div className="recent">
            Recent:{" "}
            {recentCities.map((c, i) => (
              <button
                key={i}
                className="recent-btn"
                onClick={() => handleSearch(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {weather && (
          <div className="weather-info">
            <div className="main-info">
              <span className="icon">
                {getWeatherIcon(weather.weather[0].main)}
              </span>
              <h2>
                {weather.name}, {weather.sys.country}
              </h2>
              <p className="temp">{Math.round(weather.main.temp)}°C</p>
              <p className="description">
                {weather.weather[0].description.charAt(0).toUpperCase() +
                  weather.weather[0].description.slice(1)}
              </p>
            </div>

            <div className="details">
              <p>Feels like: {Math.round(weather.main.feels_like)}°C</p>
              <p>Humidity: {weather.main.humidity}%</p>
              <p>Wind: {weather.wind.speed} m/s</p>
              <p>Pressure: {weather.main.pressure} hPa</p>
              <p>
                Sunrise:{" "}
                {new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>
                Sunset:{" "}
                {new Date(weather.sys.sunset * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}

        {aqi && (
          <div className="aqi-section">
            <h3>Air Quality Index</h3>
            <div className="aqi-bar">
              <div
                className="aqi-fill"
                style={{
                  width: `${aqi * 20}%`,
                  backgroundColor: getAqiInfo(aqi).color,
                }}
              ></div>
            </div>
            <p className="aqi-label" style={{ color: getAqiInfo(aqi).color }}>
              {aqi} – {getAqiInfo(aqi).label}
            </p>
            <p className="aqi-desc">{getAqiInfo(aqi).desc}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
