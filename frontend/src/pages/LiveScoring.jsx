import React, { useState, useEffect } from 'react';
import { generateCommentary } from '../utils/commentary';
import {
  calculateStrikeRate,
  calculateEconomy,
  formatOvers,
  shouldRotateStrike,
  isOverComplete,
  isInningsComplete,
  isLegalDelivery,
  calculateMatchResult
} from '../utils/matchUtils';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const LiveScoring = () => {
  const [matchData, setMatchData] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [tempShot, setTempShot] = useState(null);
  const [tempArea, setTempArea] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [showPlayerSelection, setShowPlayerSelection] = useState(null);

  // Load match data on mount
  useEffect(() => {
    loadMatchData();
  }, []);

  const loadMatchData = async () => {
    try {
      const response = await fetch('/ongoingMatch.json');
      const data = await response.json();
      setMatchData(data);
      
      // Load available players
      const teamsResponse = await fetch('/sampleTeams.json');
      const teamsData = await teamsResponse.json();
      setAvailablePlayers(teamsData.teams);
    } catch (error) {
      console.error('Error loading match data:', error);
    }
  };

  const saveMatchData = (data) => {
    // In a real app, this would save to backend
    // For now, we'll just update state
    setMatchData(data);
    
    // Simulate saving to JSON file (in browser local storage)
    localStorage.setItem('ongoingMatch', JSON.stringify(data));
  };

  const getCurrentInnings = () => {
    if (!matchData) return null;
    return matchData.innings[matchData.currentInnings - 1];
  };

  const commitBall = (eventType, eventData = {}) => {
    if (!matchData) return;

    // 1. Push current state to undo stack
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(matchData))]);

    const innings = getCurrentInnings();
    const newMatchData = JSON.parse(JSON.stringify(matchData));
    const newInnings = newMatchData.innings[newMatchData.currentInnings - 1];

    // 2. Build ball object
    const ball = {
      ballNumber: newInnings.balls + 1,
      over: formatOvers(newInnings.balls + 1),
      bowler: newInnings.currentBowler,
      batsman: newInnings.striker,
      runs: 0,
      extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
      isWicket: false,
      shot: tempShot,
      area: tempArea,
      ...eventData
    };

    // 3. Determine if legal delivery
    const isLegal = isLegalDelivery(ball);

    // 4. Update scores and stats
    let totalRuns = ball.runs || 0;
    
    // Handle extras
    if (eventType === 'wide') {
      ball.extras.wide = 1;
      totalRuns += 1;
      newInnings.extras.wide += 1;
      newInnings.extras.total += 1;
    } else if (eventType === 'noBall') {
      ball.extras.noBall = 1;
      totalRuns += 1;
      newInnings.extras.noBall += 1;
      newInnings.extras.total += 1;
    } else if (eventType === 'bye') {
      ball.extras.bye = ball.runs;
      newInnings.extras.bye += ball.runs;
      newInnings.extras.total += ball.runs;
    } else if (eventType === 'legBye') {
      ball.extras.legBye = ball.runs;
      newInnings.extras.legBye += ball.runs;
      newInnings.extras.total += ball.runs;
    }

    newInnings.score += totalRuns;

    // Update batsman stats (only if not extras like bye/legbye)
    if (!['bye', 'legBye'].includes(eventType)) {
      const strikerIndex = newInnings.batsmen.findIndex(b => b.name === newInnings.striker && !b.isOut);
      if (strikerIndex !== -1) {
        if (isLegal) {
          newInnings.batsmen[strikerIndex].balls += 1;
        }
        newInnings.batsmen[strikerIndex].runs += ball.runs;
        if (ball.runs === 4) newInnings.batsmen[strikerIndex].fours += 1;
        if (ball.runs === 6) newInnings.batsmen[strikerIndex].sixes += 1;
        newInnings.batsmen[strikerIndex].strikeRate = calculateStrikeRate(
          newInnings.batsmen[strikerIndex].runs,
          newInnings.batsmen[strikerIndex].balls
        );
      }
    }

    // Update bowler stats
    const bowlerIndex = newInnings.bowlers.findIndex(b => b.name === newInnings.currentBowler);
    if (bowlerIndex !== -1) {
      if (isLegal) {
        newInnings.bowlers[bowlerIndex].balls += 1;
      }
      newInnings.bowlers[bowlerIndex].runs += totalRuns;
      if (ball.isWicket) {
        newInnings.bowlers[bowlerIndex].wickets += 1;
      }
      newInnings.bowlers[bowlerIndex].overs = formatOvers(newInnings.bowlers[bowlerIndex].balls);
      newInnings.bowlers[bowlerIndex].economy = calculateEconomy(
        newInnings.bowlers[bowlerIndex].runs,
        newInnings.bowlers[bowlerIndex].balls
      );
    }

    // 5. Rotate strike if needed
    if (shouldRotateStrike(totalRuns) && !ball.isWicket) {
      [newInnings.striker, newInnings.nonStriker] = [newInnings.nonStriker, newInnings.striker];
    }

    // 6. Handle over completion
    if (isLegal) {
      newInnings.balls += 1;
      newInnings.overs = formatOvers(newInnings.balls);
      
      if (isOverComplete(newInnings.balls)) {
        // Rotate strike at end of over
        [newInnings.striker, newInnings.nonStriker] = [newInnings.nonStriker, newInnings.striker];
        // Show bowler selection for next over
        setShowPlayerSelection('bowler');
      }
    }

    // 7. Handle wicket
    if (ball.isWicket) {
      newInnings.wickets += 1;
      
      // Mark batsman as out
      const outBatsmanIndex = newInnings.batsmen.findIndex(b => b.name === newInnings.striker);
      if (outBatsmanIndex !== -1) {
        newInnings.batsmen[outBatsmanIndex].isOut = true;
        newInnings.batsmen[outBatsmanIndex].dismissal = ball.dismissalType;
      }
      
      // Show new batsman selection
      setShowPlayerSelection('batsman');
    }

    // 8. Generate commentary
    ball.commentary = generateCommentary(ball, newInnings.striker, newInnings.currentBowler);

    // 9. Append ball to innings
    newInnings.ballByBall.push(ball);

    // 10. Check innings end
    if (isInningsComplete(newInnings.wickets, newInnings.balls, newMatchData.overs)) {
      if (newMatchData.currentInnings === 1) {
        // Start second innings
        newMatchData.currentInnings = 2;
        newMatchData.innings.push({
          inningsNumber: 2,
          battingTeam: newMatchData.teamB.name,
          bowlingTeam: newMatchData.teamA.name,
          score: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          extras: { wide: 0, noBall: 0, bye: 0, legBye: 0, total: 0 },
          batsmen: [],
          bowlers: [],
          ballByBall: [],
          striker: null,
          nonStriker: null,
          currentBowler: null
        });
        setShowPlayerSelection('all');
      } else {
        // Match complete
        newMatchData.status = 'completed';
        const result = calculateMatchResult(newMatchData.innings);
        newMatchData.result = result;
      }
    }

    // 11. Persist
    saveMatchData(newMatchData);

    // 12. Reset temp state
    setTempShot(null);
    setTempArea(null);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setMatchData(previousState);
    setUndoStack(undoStack.slice(0, -1));
    saveMatchData(previousState);
  };

  const endMatch = () => {
    if (!matchData) return;
    
    const newMatchData = { ...matchData };
    newMatchData.status = 'completed';
    
    if (newMatchData.innings.length >= 2) {
      const result = calculateMatchResult(newMatchData.innings);
      newMatchData.result = result;
    }
    
    // Move to played matches
    const playedMatches = JSON.parse(localStorage.getItem('playedMatches') || '[]');
    playedMatches.push(newMatchData);
    localStorage.setItem('playedMatches', JSON.stringify(playedMatches));
    
    // Clear ongoing match
    localStorage.removeItem('ongoingMatch');
    setMatchData(null);
    
    alert('Match ended and saved to played matches!');
  };

  const selectPlayer = (playerName, role) => {
    if (!matchData) return;
    
    const newMatchData = { ...matchData };
    const innings = newMatchData.innings[newMatchData.currentInnings - 1];
    
    if (role === 'striker') {
      innings.striker = playerName;
      
      // Add to batsmen if not exists
      if (!innings.batsmen.find(b => b.name === playerName)) {
        innings.batsmen.push({
          name: playerName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false,
          dismissal: null
        });
      }
    } else if (role === 'nonStriker') {
      innings.nonStriker = playerName;
      
      if (!innings.batsmen.find(b => b.name === playerName)) {
        innings.batsmen.push({
          name: playerName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false,
          dismissal: null
        });
      }
    } else if (role === 'bowler') {
      innings.currentBowler = playerName;
      
      if (!innings.bowlers.find(b => b.name === playerName)) {
        innings.bowlers.push({
          name: playerName,
          overs: 0,
          balls: 0,
          runs: 0,
          wickets: 0,
          economy: 0,
          maidens: 0
        });
      }
    }
    
    saveMatchData(newMatchData);
    
    // Check if we need more selections
    if (showPlayerSelection === 'all') {
      if (!innings.striker) return;
      if (!innings.nonStriker) return;
      if (!innings.currentBowler) return;
      setShowPlayerSelection(null);
    } else if (showPlayerSelection === 'batsman') {
      if (role === 'striker') {
        setShowPlayerSelection(null);
      }
    } else if (showPlayerSelection === 'bowler') {
      setShowPlayerSelection(null);
    }
  };

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading match data...</div>
      </div>
    );
  }

  const innings = getCurrentInnings();
  const battingTeamData = availablePlayers.find(t => t.name === innings?.battingTeam);
  const bowlingTeamData = availablePlayers.find(t => t.name === innings?.bowlingTeam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Match Header */}
        <Card className="bg-slate-800/50 border-cyan-500/30 backdrop-blur p-4" data-testid="match-header">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-cyan-400" data-testid="match-title">
                {matchData.teamA.shortName} vs {matchData.teamB.shortName}
              </h1>
              <p className="text-gray-400 text-sm mt-1" data-testid="match-venue">{matchData.venue}</p>
              <p className="text-gray-400 text-xs" data-testid="match-datetime">{matchData.date} • {matchData.time}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400" data-testid="innings-info">Innings {matchData.currentInnings}</div>
              <div className="text-4xl font-bold text-cyan-400" data-testid="current-score">
                {innings?.score}/{innings?.wickets}
              </div>
              <div className="text-xl text-gray-300" data-testid="current-overs">Overs: {innings?.overs}</div>
              <div className={`text-sm font-semibold mt-2 ${matchData.status === 'live' ? 'text-green-400' : 'text-yellow-400'}`} data-testid="match-status">
                {matchData.status === 'live' ? '🔴 LIVE' : 'COMPLETED'}
              </div>
            </div>
          </div>
        </Card>

        {/* Player Selection Modal */}
        {showPlayerSelection && (
          <Card className="bg-slate-800 border-cyan-500/50 p-6" data-testid="player-selection-panel">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">
              {showPlayerSelection === 'all' && 'Select Players'}
              {showPlayerSelection === 'batsman' && 'Select New Batsman'}
              {showPlayerSelection === 'bowler' && 'Select Bowler'}
            </h3>
            
            {(showPlayerSelection === 'all' || showPlayerSelection === 'batsman') && (
              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-2">Batsmen ({battingTeamData?.shortName})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {battingTeamData?.players.map(player => {
                    // Check if already batting (not out)
                    const alreadyBatting = innings?.batsmen.find(b => b.name === player && !b.isOut);
                    // Check if this batsman is out (should be hidden from selection)
                    const isOut = innings?.batsmen.find(b => b.name === player && b.isOut);
                    
                    // Don't show batsmen who are already out
                    if (isOut) return null;
                    
                    return (
                      <Button
                        key={player}
                        onClick={() => {
                          if (showPlayerSelection === 'all') {
                            if (!innings?.striker) selectPlayer(player, 'striker');
                            else if (!innings?.nonStriker) selectPlayer(player, 'nonStriker');
                          } else {
                            selectPlayer(player, 'striker');
                          }
                        }}
                        disabled={alreadyBatting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30"
                        data-testid={`select-batsman-${player.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {player}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {(showPlayerSelection === 'all' || showPlayerSelection === 'bowler') && (
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Bowlers ({bowlingTeamData?.shortName})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {bowlingTeamData?.players.map(player => {
                    // Check if this bowler is currently bowling
                    const isCurrentBowler = innings?.currentBowler === player;
                    
                    return (
                      <Button
                        key={player}
                        onClick={() => selectPlayer(player, 'bowler')}
                        disabled={isCurrentBowler}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-30"
                        data-testid={`select-bowler-${player.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {player}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Active Players */}
        {innings && innings.striker && innings.nonStriker && innings.currentBowler && (
          <Card className="bg-slate-800/50 border-cyan-500/30 backdrop-blur p-4" data-testid="active-players">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-400">Striker</div>
                <div className="text-lg font-semibold text-cyan-400" data-testid="striker-name">{innings.striker}</div>
                <div className="text-sm text-gray-300" data-testid="striker-stats">
                  {innings.batsmen.find(b => b.name === innings.striker)?.runs || 0} ({innings.batsmen.find(b => b.name === innings.striker)?.balls || 0})
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Non-Striker</div>
                <div className="text-lg font-semibold text-gray-300" data-testid="non-striker-name">{innings.nonStriker}</div>
                <div className="text-sm text-gray-300" data-testid="non-striker-stats">
                  {innings.batsmen.find(b => b.name === innings.nonStriker)?.runs || 0} ({innings.batsmen.find(b => b.name === innings.nonStriker)?.balls || 0})
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Bowler</div>
                <div className="text-lg font-semibold text-red-400" data-testid="bowler-name">{innings.currentBowler}</div>
                <div className="text-sm text-gray-300" data-testid="bowler-stats">
                  {innings.bowlers.find(b => b.name === innings.currentBowler)?.overs || '0.0'} Ov • {innings.bowlers.find(b => b.name === innings.currentBowler)?.runs || 0}/{innings.bowlers.find(b => b.name === innings.currentBowler)?.wickets || 0}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Ball Event Panel */}
        {matchData.status === 'live' && innings && innings.striker && innings.currentBowler && !showPlayerSelection && (
          <Card className="bg-slate-800 border-cyan-500/50 p-6" data-testid="ball-event-panel">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Score Ball</h3>
            
            {/* Context Buttons */}
            <div className="mb-6">
              <h4 className="text-sm text-gray-400 mb-2">Shot Type</h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {['Drive', 'Pull', 'Cut', 'Sweep', 'Straight', 'Lofted', 'Defensive', 'Other'].map(shot => (
                  <Button
                    key={shot}
                    onClick={() => setTempShot(shot)}
                    variant={tempShot === shot ? 'default' : 'outline'}
                    className={tempShot === shot ? 'bg-cyan-600' : 'border-cyan-500/50 hover:bg-cyan-600/20'}
                    data-testid={`shot-${shot.toLowerCase()}`}
                  >
                    {shot}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm text-gray-400 mb-2">Area</h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {['Cover', 'Square Leg', 'Point', 'Fine Leg', 'Long On', 'Long Off', 'Mid Off', 'Mid Wicket'].map(area => (
                  <Button
                    key={area}
                    onClick={() => setTempArea(area)}
                    variant={tempArea === area ? 'default' : 'outline'}
                    className={tempArea === area ? 'bg-cyan-600' : 'border-cyan-500/50 hover:bg-cyan-600/20'}
                    data-testid={`area-${area.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {area}
                  </Button>
                ))}
              </div>
            </div>

            {/* Runs */}
            <div className="mb-6">
              <h4 className="text-sm text-gray-400 mb-2">Runs</h4>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 6].map(runs => (
                  <Button
                    key={runs}
                    onClick={() => commitBall('runs', { runs })}
                    className={`${runs === 4 || runs === 6 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-xl font-bold`}
                    data-testid={`runs-${runs}`}
                  >
                    {runs}
                  </Button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="mb-6">
              <h4 className="text-sm text-gray-400 mb-2">Extras</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => commitBall('wide', { runs: 0 })}
                  className="bg-yellow-600 hover:bg-yellow-700"
                  data-testid="extra-wide"
                >
                  Wide
                </Button>
                <Button
                  onClick={() => commitBall('noBall', { runs: 0 })}
                  className="bg-yellow-600 hover:bg-yellow-700"
                  data-testid="extra-no-ball"
                >
                  No Ball
                </Button>
                <Button
                  onClick={() => commitBall('bye', { runs: 1 })}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="extra-bye"
                >
                  Bye
                </Button>
                <Button
                  onClick={() => commitBall('legBye', { runs: 1 })}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="extra-leg-bye"
                >
                  Leg Bye
                </Button>
              </div>
            </div>

            {/* Wickets */}
            <div className="mb-6">
              <h4 className="text-sm text-gray-400 mb-2">Wickets</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'].map(dismissal => (
                  <Button
                    key={dismissal}
                    onClick={() => commitBall('wicket', { runs: 0, isWicket: true, dismissalType: dismissal })}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid={`wicket-${dismissal.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {dismissal}
                  </Button>
                ))}
              </div>
            </div>

            {/* Undo Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleUndo}
                disabled={undoStack.length === 0 || matchData.status !== 'live'}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-30"
                data-testid="undo-button"
              >
                ↶ Undo Last Ball
              </Button>
              <Button
                onClick={endMatch}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="end-match-button"
              >
                End Match
              </Button>
            </div>
          </Card>
        )}

        {/* Recent Balls */}
        {innings && innings.ballByBall.length > 0 && (
          <Card className="bg-slate-800/50 border-cyan-500/30 backdrop-blur p-4" data-testid="recent-balls">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">Recent Balls</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...innings.ballByBall].reverse().slice(0, 10).map((ball, idx) => (
                <div key={idx} className="text-sm border-l-2 border-cyan-500 pl-3 py-1" data-testid={`ball-commentary-${idx}`}>
                  <div className="text-gray-400 text-xs">{ball.over}</div>
                  <div className="text-white">{ball.commentary}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Match Result */}
        {matchData.status === 'completed' && matchData.result && (
          <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-400 p-6 text-center" data-testid="match-result">
            <h2 className="text-3xl font-bold text-white mb-2">Match Completed!</h2>
            <p className="text-2xl text-white font-semibold">{matchData.result.result}</p>
          </Card>
        )}

      </div>
    </div>
  );
};

export default LiveScoring;
