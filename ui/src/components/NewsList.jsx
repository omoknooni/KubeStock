import React from "react";

const NewsList = ({ news }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
      {news.map((article, index) => (
        <div key={index} style={{ border: "1px solid #ccc", padding: "10px" }}>
          <img
            src={article.thumbnail || "https://via.placeholder.com/150"}
            alt={article.title}
            style={{ width: "100%", height: "150px", objectFit: "cover" }}
          />
          <h3>{article.title}</h3>
        </div>
      ))}
    </div>
  );
};

export default NewsList;
