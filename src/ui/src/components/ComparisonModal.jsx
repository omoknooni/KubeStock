import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from "@mui/material";

const ComparisonModal = ({open, onClose, cik}) => {
    const [changes, setChanges] = useState(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (open) {
            // fetch(`/api/stocks/inout/${cik}`)
            fetch(`http://localhost:8000/api/stocks/inout/${cik}`)
            .then((res) => res.json())
            .then((json) => setChanges(json))
            .catch(() => setChanges({ changed: {} }));
        }
    }, [open, cik]);
    
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
          <DialogTitle>이전 분기 대비 변동 사항</DialogTitle>
          <DialogContent>
            {!changes ? (
              <CircularProgress />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>CUSIP</TableCell>
                    <TableCell align="right">Previous</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Change (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(changes.changed).map(([cusip, c]) => (
                    <TableRow key={cusip}>
                      <TableCell>{cusip}</TableCell>
                      <TableCell align="right">{c.previous.toLocaleString()}</TableCell>
                      <TableCell align="right">{c.current.toLocaleString()}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: c.rate_changed >= 0 ? 'green' : 'red',
                          fontWeight: 'bold',
                        }}
                      >
                        {c.rate_changed}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      );
};

export default ComparisonModal;