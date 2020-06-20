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
          {Object.keys(props.tokenData).map((token: string, index: number) => (
            <TableRow key={token}>
              <TableCell align="left">{token}</TableCell>
              <TableCell align="center">
                {props.tokenData[token] || "0"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
