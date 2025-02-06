import React, { useState, useEffect } from "react";
import HotNews from "../components/HotNewsList";
import MainNews from "../components/MainNewsList";
import { Container, Box, Card, CardContent, CardMedia, Typography } from "@mui/material";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가

  // useEffect(() => {
  //   const fetchData = async () => { // async 함수로 변경
  //     try {
  //       const res = await fetch("/api/news");
  //       if (!res.ok) { // 응답 상태 코드 확인
  //         throw new Error(`HTTP error! status: ${res.status}`);
  //       }
  //       const data = await res.json();
  //       setNews(data.articles || []);
  //     } catch (err) {
  //       setError(err); // 에러 상태 업데이트
  //       console.error("Error fetching news:", err);
  //     } finally {
  //       setLoading(false); // 로딩 상태 업데이트
  //     }
  //   };

  //   fetchData();
  // }, []);

  // if (loading) {
  //   return <div>Loading news...</div>; // 로딩 중 메시지 표시
  // }

  // if (error) {
  //   return <div>Error: {error.message}</div>; // 에러 메시지 표시
  // }

  return (
    <Container sx={{ marginTop: 4, marginBottom: 7}}>
      <MainNews />
      <HotNews />
    </Container>
  );
};

export default News;