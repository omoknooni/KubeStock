import React, { useEffect, useState } from "react";
import { Container, Box, Grid, Card, CardContent, CardMedia, Typography, Pagination, Chip, IconButton } from "@mui/material";
import { Share as ShareIcon, Bookmark as BookmarkIcon } from '@mui/icons-material';
import getRelativeTime from "../utils/util";
import { getImageUrl } from "../utils/imageHelper";


const sampleNews = [
  {
    id: 1,
    title: "뉴스 제목 1",
    pub_date: "2025-02-03 11:23:00",
    source: "뉴스 제공사 1",
    media_url: "https://placehold.co/150"
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

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TodayNews =  () => {
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/news?type=today`);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          오늘의 뉴스
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {getTodayDate()}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {displayedNews.map((article, index) => (
          <Grid item xs={12} md={index === 0 ? 12 : 6} key={article.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: index === 0 ? 'row' : 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardMedia
                component="img"
                image={getImageUrl(article.media_url)}
                alt={article.title}
                sx={{
                  width: index === 0 ? '40%' : '100%',
                  height: index === 0 ? 300 : 200,
                  objectFit: 'cover'
                }}
              />
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={article.source}
                    size="small"
                    sx={{ mb: 1 }}
                    color="primary"
                  />
                  <Typography 
                    variant={index === 0 ? "h5" : "h6"}
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 1,
                      lineHeight: 1.4,
                      height: index === 0 ? 'auto' : '3em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {article.title}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  mt: 'auto', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    {getRelativeTime(article.pub_date)}
                  </Typography>
                  <Box>
                    <IconButton size="small">
                      <BookmarkIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={Math.ceil(news.length / ITEMS_PER_PAGE)}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
          size="large"
          sx={{
            '& .MuiPaginationItem-root': {
              fontSize: '1.1rem'
            }
          }}
        />
      </Box>
    </Container>
  );
};

export default TodayNews;
