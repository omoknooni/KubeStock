import React, { useState, useEffect } from "react";
import HotNews from "../components/HotNewsList";
import MainNews from "../components/MainNewsList";
import { Container, Box, Card, CardContent, CardMedia, Typography } from "@mui/material";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가

  return (
    <Container sx={{ marginTop: 4, marginBottom: 7}}>
      <MainNews />
      <HotNews />
    </Container>
  );
};

export default News;