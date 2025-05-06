// CelebrityCard.jsx
import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    const [portfolioChartData, setPortfolioChartData] = useState(null);
    const [openModal, setOpenModal] = useState(false);
  
    const handleExpand = async (_, isExpanded) => {
      if (isExpanded && !portfolioChartData) {
        try {
        //   const res = await fetch(`/api/stocks/portfolio_overview/${cik}`);
          const res = await fetch(`http://localhost:8000/api/stocks/portfolio_overview/${cik}`);
          if (!res.ok) throw new Error('포트폴리오 조회 실패');
          const { holdings } = await res.json();
          const chartData = transformHoldingsToChartData(holdings);
          setPortfolioChartData(chartData);
        } catch (e) {
          console.error(e);
        }
      }
    };

  return (
    <>
      <Card>
        <CardMedia component="img" height={140} image={img} alt={name} />
        <CardContent>
          <Typography variant="h6">{name}</Typography>
          <Typography variant="body2">{desc}</Typography>
        </CardContent>

        <Accordion onChange={handleExpand}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>포트폴리오 ▶</Typography>
          </AccordionSummary>

          <AccordionDetails>
            {!portfolioChartData ? (
              <CircularProgress />
            ) : (
              <>
                <CelebrityPortfolioChart data={portfolioChartData}/>
                <Button onClick={() => setOpenModal(true)} sx={{ mt: 2 }}>이전 분기와 비교</Button>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      </Card>

      <ComparisonModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        cik={cik}
      />
    </>
  );
}
