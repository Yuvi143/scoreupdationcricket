export const calculateStrikeRate = (runs, balls) => {
  if (balls === 0) return 0;
  return ((runs / balls) * 100).toFixed(2);
};

export const calculateEconomy = (runs, balls) => {
  if (balls === 0) return 0;
  const overs = balls / 6;
  return (runs / overs).toFixed(2);
};

export const formatOvers = (balls) => {
  const completedOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${completedOvers}.${remainingBalls}`;
};

export const shouldRotateStrike = (runs) => {
  // Rotate strike on odd runs (1, 3, 5, etc.)
  return runs % 2 !== 0;
};

export const isOverComplete = (balls) => {
  return balls % 6 === 0 && balls > 0;
};

export const isInningsComplete = (wickets, balls, maxOvers) => {
  const maxBalls = maxOvers * 6;
  return wickets >= 10 || balls >= maxBalls;
};

export const isLegalDelivery = (ball) => {
  // Wide and no-ball are not legal deliveries
  return !ball.extras?.wide && !ball.extras?.noBall;
};

export const calculateMatchResult = (innings) => {
  if (innings.length < 2) return null;

  const innings1 = innings[0];
  const innings2 = innings[1];

  const team1Score = innings1.score;
  const team2Score = innings2.score;

  if (team2Score > team1Score) {
    const wicketsRemaining = 10 - innings2.wickets;
    return {
      winner: innings2.battingTeam,
      margin: `${wicketsRemaining} wickets`,
      result: `${innings2.battingTeam} won by ${wicketsRemaining} wickets`
    };
  } else if (team1Score > team2Score) {
    const runsDifference = team1Score - team2Score;
    return {
      winner: innings1.battingTeam,
      margin: `${runsDifference} runs`,
      result: `${innings1.battingTeam} won by ${runsDifference} runs`
    };
  } else {
    return {
      winner: null,
      margin: 'Tie',
      result: 'Match Tied'
    };
  }
};
