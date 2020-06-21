import React, { useEffect, useState } from "react";
import { dataTableProps } from "../../../types/leaderboardTypes";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableHead,
  Paper,
} from "@material-ui/core";

const DataTable = (props: dataTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>{props.address}</TableCell>
          </TableRow>
        </TableHead>
        <TableHead>
          <TableRow>
            <TableCell>Adventure Tokens</TableCell>
            <TableCell align="right">Bag</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(props.tokenData).map((token, index: number) => (
            <TableRow key={props.tokenData[index].ticker}>
              <TableCell align="left">
                <a
                  href={props.tokenData[index].link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {props.tokenData[index].ticker}
                </a>
              </TableCell>
              <TableCell align="center">
                {props.tokenData[index].balance || "0"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
