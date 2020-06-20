import React, { useEffect, useState } from "react";
import { tokenDataObj } from "../../../types/leaderboardTypes";
import getBalance from "./getBalance";
import MetamaskButton from "./metamask";
import tokenData from "./tokenData";

const LeaderboardWidget = () => {
  const [address, setAddress] = useState("");
  const [connection, setConnection] = useState(false);
  const [tokenTableData, setTokenTableData] = useState<tokenDataObj>(tokenData);

  useEffect(() => {
    if (!connection || !address) return;
    (async () => {
      let balances = await Promise.all(
        Object.entries(tokenTableData).map(async ([token, data]) => {
          return await getBalance(tokenTableData[token].address, address);
        })
      );
      for (let i = 0; i <= balances.length; i++) {
        if (balances[i] === "") {
          balances[i] = "0";
        }
      }
      setTokenBalance((tokenBalance) => ({
        ...tokenBalance,
        tokens: balances,
      }));
    })();
  }, [isConnected, userAccount]);
};
