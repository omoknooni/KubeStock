import React, { useState, useEffect } from "react";
import NewsList from "../components/NewsList";

const News = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/news")
      .then((res) => res.json())
      .then((data) => setNews(data.articles || []));
  }, []);

  return (
    <div>
      <h1>News</h1>
      <NewsList news={news} />
    </div>
  );
};

export default News;
