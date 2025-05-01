import React, { useEffect, useState } from "react";
import { Container, Box, Card, CardContent, CardActionArea, CardMedia, Typography, Pagination } from "@mui/material";
import getRelativeTime from "../utils/util";
import { getImageUrl } from "../utils/imageHelper";


const sampleNews = [
  {
    id: 1,
    title: "뉴스 제목 1",
    pub_date: "2025-02-03 11:23:00",
    source: "뉴스 제공사 1",
    media_url: null,
    link: "#"
  },
  {
    id: 2,
    title: "뉴스 제목 2",
    pub_date: "2025-02-02 18:30:23",
    source: "뉴스 제공사 2",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 3,
    title: "뉴스 제목 3",
    pub_date: "2025-02-01 09:45:00",
    source: "뉴스 제공사 3",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 4,
    title: "뉴스 제목 4",
    pub_date: "2025-01-31 14:20:00",
    source: "뉴스 제공사 4",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 5,
    title: "뉴스 제목 5",
    pub_date: "2025-01-30 16:10:00",
    source: "뉴스 제공사 5",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 6,
    title: "뉴스 제목 6",
    pub_date: "2025-01-29 12:00:00",
    source: "뉴스 제공사 6",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 7,
    title: "뉴스 제목 7",
    pub_date: "2025-01-28 10:00:00",
    source: "뉴스 제공사 7",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 8,
    title: "뉴스 제목 8",
    pub_date: "2025-01-27 09:00:00",
    source: "뉴스 제공사 8",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 9,
    title: "뉴스 제목 9",
    pub_date: "2025-01-26 23:32:12",
    source: "뉴스 제공사 9",
    media_url: "https://placehold.co/150",
    link: "#"
  },
  {
    id: 10,
    title: "뉴스 제목 10",
    pub_date: "2025-01-25 18:00:00",
    source: "뉴스 제공사 10",
    media_url: "https://placehold.co/150",
    link: "#"
  }
];

const ITEMS_PER_PAGE = 5;

const HotNews =  () => {
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/news?type=hot`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
  
        if (data.success && Array.isArray(data.data)) {
          setNews(data.data);
        } else {
          console.warn("API returned unexpected format, fallback to sampleNews.");
          setNews(sampleNews);
        }
      } catch (error) {
        console.error("Error while Fetching data : ", error.message);
        setNews(sampleNews);
      }
    };
  
    fetchData();
  }, []);
  const handleChange = (event, value) => {
    setPage(value);
  };

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const displayedNews = news.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  return (
    <Container maxWidth="lg" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        최신 뉴스
      </Typography>
  
      {displayedNews.map((article) => (
        <Card key={article.id} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
          <CardActionArea
            component="a"
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'flex',        // ← flex 유지
              width: '100%',          // ← 가로 꽉 채우기
              textDecoration: 'none', // ← 링크 밑줄 제거
              color: 'inherit'        // ← 텍스트 컬러 유지
            }}
          >
            {article.media_url && (
              <CardMedia
                component="img"
                sx={{ width: 150, height: 100, flexShrink: 0 }} // ← 이미지 고정 크기
                image={getImageUrl(article.media_url)}
                alt={article.title}
              />
            )}
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6">{article.title}</Typography>
              <Typography variant="body2" color="textSecondary">
                {article.source} | {getRelativeTime(article.pub_date || article.created_at)}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
  
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={Math.ceil(news.length / ITEMS_PER_PAGE)}
          page={page}
          onChange={handleChange}
          color="primary"
        />
      </Box>
    </Container>
  );
  
};

export default HotNews;
