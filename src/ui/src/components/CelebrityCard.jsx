// CelebrityCard.jsx
import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  Typography,
  Button,
  Drawer,
  Box,
} from '@mui/material';
import ComparisonModal from './ComparisonModal';
import CelebrityPortfolioChart from './CelebrityPortfolioChart';

// API 응답을 nivo 도넛 차트용 데이터로 변환
const transformHoldingsToChartData = (holdings) =>
    holdings.map((h, index, arr) => ({
      id: h.issuer,
      label: h.issuer,
      value: h.value,
      color: `hsl(${Math.round((index * 360) / arr.length)}, 70%, 50%)`,
}));

export default function CelebrityCard({ name, cik, img, desc }) {
    const [portfolio, setPortfolio] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [openDrawer, setOpenDrawer] = useState(false);
  
    const loadPortfolio = async () => {
      if (portfolio) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/portfolio_overview/${cik}`);
        if (!res.ok) throw new Error('포트폴리오 조회 실패');
        const json = await res.json();
        const chartData = transformHoldingsToChartData(json.holdings);
        setPortfolio({ meta: json, chartData });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    const handleOpen = () => {
      loadPortfolio();
      setOpenDrawer(true);
    };

  return (
    <>
      <Card>
        <CardMedia component="img" image={img} alt={name} sx={{ width: "100%", height: 'auto' }} />
        <CardContent>
          <Typography variant="h6">{name}</Typography>
          <Typography variant="body2">{desc}</Typography>
        </CardContent>
        <CardActions>
          <Button fullWidth onClick={handleOpen}>
            포트폴리오 보기
          </Button>
        </CardActions>
      </Card>

      <Drawer anchor="bottom" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <Box width={360} p={2}>
          {loading && <CircularProgress />}
          {error && <Typography color="error">{error}</Typography>}
          {portfolio && (
            <>
              <CelebrityPortfolioChart data={portfolio.chartData} />
              <Button
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => setOpenModal(true)}
              >
                이전 분기 비교
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      <ComparisonModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        cik={cik}
      />
    </>
  );
}
