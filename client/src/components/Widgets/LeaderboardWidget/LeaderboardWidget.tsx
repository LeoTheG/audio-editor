import React, { useEffect, useState } from "react";
import { tokenDataObj } from "../../../types/leaderboardTypes";
import getBalance from "./getBalance";
import tokenData from "./tokenData";
import MetamaskButton from "./metamask";
import DataTable from "./DataTable";
import "../../css/leaderboard.css";

const LeaderboardWidget = () => {
  const [clientAddress, setClientAddress] = useState("");
  const [connection, setConnection] = useState(false);
  const [tokenTableData, setTokenTableData] = useState<tokenDataObj>(tokenData);

  useEffect(() => {
    if (!connection || !clientAddress) return;
    const updatedTableData: tokenDataObj = tokenTableData;
    (async () => {
      let balances = await Promise.all(
        Object.entries(updatedTableData).map(async ([token, data]) => {
          return await getBalance(data.address, clientAddress);
        })
      );
      for (let i = 0; i <= balances.length; i++) {
        if (balances[i] === "") balances[i] = "0";
        updatedTableData[i].balance = parseInt(balances[i]);
      }
      setTokenTableData(updatedTableData);
    })();
  }, [connection, clientAddress]);

  return (
    <div className="leaderboard-container">
      {connection ? (
        <DataTable address={clientAddress} tokenData={tokenTableData} />
      ) : (
        <MetamaskButton
          setAddress={setClientAddress}
          setConnection={setConnection}
        />
      )}
    </div>
  );
};

export default LeaderboardWidget;
