import "./css/Leaderboard.css";

import React, { useCallback } from "react";

interface ILeaderboardProps {
  scores: { name: string; score: number }[];
}

const medalEmojis: { [key: number]: string } = {
  0: "1f947",
  1: "1f948",
  2: "1f949",
};

export const Leaderboard = (props: ILeaderboardProps) => {
  const inOrderScores = props.scores.sort((a, b) => b.score - a.score);

  const medal = useCallback((index: number) => {
    const emoji = medalEmojis[index];
    if (emoji) {
      return (
        <img
          alt="medal"
          style={{ width: 30 }}
          src={`https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/${emoji}.png`}
        />
      );
    } else return null;
  }, []);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-title">leaderboard</div>
      {inOrderScores.map((score, index) => (
        <div key={score.name + score.score} style={{ display: "flex" }}>
          <div className="leaderboard-name">{score.name}</div>
          <div className="leaderboard-score">
            {score.score}
            <div className="leaderboard-medal">{medal(index)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
