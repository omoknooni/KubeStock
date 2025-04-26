import React, { useState, useEffect } from "react";
import { Container, Typography, Card, CardMedia, CardContent, Grid, Box, Pagination } from "@mui/material";
import getRelativeTime from "../utils/util";
import { getImageUrl } from "../utils/imageHelper";

const sampleNews = [
  {
    id: 1,
    title: "뉴스 제목 1",
    pub_date: "2025-02-03 11:23:00",
    source: "뉴스 제공사 1",
    // media_url: "https://placehold.co/150"
    media_url: null
  },
  {
    id: 2,
    title: "뉴스 제목 2",
    pub_date: "2025-02-02 18:30:23",
    source: "뉴스 제공사 2",
    media_url: "https://placehold.co/150"
  },
  {
    id: 3,
    title: "뉴스 제목 3",
    pub_date: "2025-02-01 09:45:00",
    source: "뉴스 제공사 3",
    media_url: "https://placehold.co/150"
  },
  {
    id: 4,
    title: "뉴스 제목 4",
    pub_date: "2025-01-31 14:20:00",
    source: "뉴스 제공사 4",
    media_url: "https://placehold.co/150"
  },
  {
    id: 5,
    title: "뉴스 제목 5",
    pub_date: "2025-01-30 16:10:00",
    source: "뉴스 제공사 5",
    media_url: "https://placehold.co/150"
  },
  {
    id: 6,
    title: "뉴스 제목 6",
    pub_date: "2025-01-29 12:00:00",
    source: "뉴스 제공사 6",
    media_url: "https://placehold.co/150"
  },
  {
    id: 7,
    title: "뉴스 제목 7",
    pub_date: "2025-01-28 10:00:00",
    source: "뉴스 제공사 7",
    media_url: "https://placehold.co/150"
  },
  {
    id: 8,
    title: "뉴스 제목 8",
    pub_date: "2025-01-27 09:00:00",
    source: "뉴스 제공사 8",
    media_url: "https://placehold.co/150"
  },
  {
    id: 9,
    title: "뉴스 제목 9",
    pub_date: "2025-01-26 23:32:12",
    source: "뉴스 제공사 9",
    media_url: "https://placehold.co/150"
  },
  {
    id: 10,
    title: "뉴스 제목 10",
    pub_date: "2025-01-25 18:00:00",
    source: "뉴스 제공사 10",
    media_url: "https://placehold.co/150"
  }
];

const ITEMS_PER_PAGE = 5;

const MainNews = () => {
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/news?type=main`);
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
 
  const handleChange = (_event, value) => {
    setPage(value);
  };

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const displayedNews = news.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  return (
    <Container maxWidth="lg" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        주요 뉴스
      </Typography>

      <Grid container spacing={2} sx={{height: "400px"}}>
        {/* 좌측: 첫 번째 뉴스 (메인 뉴스) */}
        <Grid item xs={12} md={7} sx={{height: "100%"}}>
          {displayedNews.length > 0 && (
            <Card sx={{ position: "relative", borderRadius: 3, overflow: "hidden", height: "100%" }}>
              <CardMedia component="img" height="100%" image={getImageUrl(displayedNews[0].media_url)} alt={displayedNews[0].title} />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  p: 2
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {displayedNews[0].title}
                </Typography>
                <Typography variant="body2">{getRelativeTime(displayedNews[0].pub_date)} · {displayedNews[0].source}</Typography>
              </Box>
            </Card>
          )}
        </Grid>

        {/* 우측: 나머지 뉴스 리스트 */}
        <Grid item xs={12} md={5}>
          {displayedNews.slice(1).map((article) => (
            <Box key={article.id} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CardMedia
                component="img"
                image={article.media_url}
                alt={article.title}
                sx={{ width: 80, height: 80, borderRadius: 2, mr: 2 }}
              />
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {article.title.length > 30 ? article.title.slice(0, 30) + "..." : article.title}
                </Typography>
                <Typography variant="body2" color="gray">
                  {getRelativeTime(article.pub_date)} · {article.source}
                </Typography>
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>

      {/* 페이지네이션 */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(news.length / ITEMS_PER_PAGE)}
          page={page}
          onChange={handleChange}
          color="primary"
          sx={{
            "& .MuiPaginationItem-root": {
              backgroundColor: "#282828",
              color: "white",
              "&.Mui-selected": {
                backgroundColor: "#616161",
              },
            }
          }}
        />
      </Box>
    </Container>
  );
};

export default MainNews;
