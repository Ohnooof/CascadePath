
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Player, Suit, Rank, AceMutationState, JokerSelectionState, SUIT_ORDER, RANK_ORDER, SUIT_NAMES, SPECIAL_CARD_EFFECTS, JOKER_COUNT } from './types';
import CardView from './components/CardView';
import JokerModal from './components/JokerModal';

type GameStage = 'setup' | 'playing' | 'gameOver';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6; 

const BIOLOGY_FACTS = [
  "Did you know? Kinases are enzymes that add phosphate groups to proteins, a common 'on' switch in signaling pathways!",
  "Second messengers like cAMP and Ca2+ amplify signals within the cell, leading to a rapid and widespread response.",
  "Scaffolding proteins bring together multiple components of a signaling pathway, increasing efficiency and specificity. Just like a Queen in this game!",
  "Negative feedback loops are crucial for turning off signaling pathways, preventing overstimulation. That's your Jack at work!",
  "Mutations in signaling pathway genes, like an Ace's effect, can lead to diseases such as cancer by disrupting normal cell regulation.",
  "Ligands can range from small molecules like hormones to large proteins on the surface of other cells.",
  "Receptor Tyrosine Kinases (RTKs) dimerize upon ligand binding, activating their intracellular kinase domains.",
  "The duration of a signal can be as important as its strength. Cells have mechanisms to terminate signals precisely.",
  "Apoptosis, or programmed cell death, is a tightly regulated signaling pathway essential for development and tissue homeostasis.",
  "Cells can integrate signals from multiple pathways to make complex decisions. The 'response' is the sum of these inputs!"
];

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentPathway, setCurrentPathway] = useState<Card[]>([]);
  const [expectedSuit, setExpectedSuit] = useState<Suit>(Suit.Clubs);
  const [playDirection, setPlayDirection] = useState<1 | -1>(1);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [aceMutation, setAceMutation] = useState<AceMutationState>({ 
    isActive: false, 
    forcedSuit: Suit.Clubs, 
    cardsToPlay: 0, 
    pathwaySuitAfterMutation: Suit.Clubs 
  });
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isQueenEffectActive, setIsQueenEffectActive] = useState(false);
  const [jokerSelection, setJokerSelection] = useState<JokerSelectionState>({ 
    isSelecting: false, 
    cardId: null, 
    requiredSuit: Suit.Clubs 
  });
  const [gameStage, setGameStage] = useState<GameStage>('setup');
  const [numPlayersInput, setNumPlayersInput] = useState<number>(MIN_PLAYERS);
  const [currentFact, setCurrentFact] = useState<string>("");

  useEffect(() => {
    // Rotate biology facts
    setCurrentFact(BIOLOGY_FACTS[Math.floor(Math.random() * BIOLOGY_FACTS.length)]);
    const factInterval = setInterval(() => {
      setCurrentFact(BIOLOGY_FACTS[Math.floor(Math.random() * BIOLOGY_FACTS.length)]);
    }, 20000); // Change fact every 20 seconds
    return () => clearInterval(factInterval);
  }, []);

  const determineNextExpectedSuit = (currentPlayedSuit: Suit): Suit => {
    const currentIndex = SUIT_ORDER.indexOf(currentPlayedSuit);
    if (currentIndex === SUIT_ORDER.length - 1) return Suit.Clubs;
    return SUIT_ORDER[currentIndex + 1];
  };

  const initializeGame = useCallback((numberOfPlayers: number) => {
    if (numberOfPlayers < MIN_PLAYERS || numberOfPlayers > MAX_PLAYERS) {
      addToLog(`Error: Invalid number of players. Must be ${MIN_PLAYERS}-${MAX_PLAYERS}.`);
      return;
    }

    const suits = Object.values(Suit);
    const ranks = Object.values(Rank).filter(r => r !== Rank.Joker);
    let deck: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ id: `${suit}${rank}`, suit, rank });
      }
    }
    for (let i = 0; i < JOKER_COUNT; i++) {
      deck.push({ id: `Joker${i + 1}`, suit: Suit.Clubs, rank: Rank.Joker, isWild: true });
    }

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const newPlayers: Player[] = Array.from({ length: numberOfPlayers }, (_, i) => ({
      id: `player${i + 1}`,
      name: `Player ${i + 1}`,
      hand: [],
    }));

    deck.forEach((card, index) => {
      newPlayers[index % numberOfPlayers].hand.push(card);
    });
    
    newPlayers.forEach(p => p.hand.sort((a,b) => SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit) || RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)));

    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setCurrentPathway([]);
    setExpectedSuit(Suit.Clubs);
    setPlayDirection(1);
    setDiscardPile([]);
    setAceMutation({ isActive: false, forcedSuit: Suit.Clubs, cardsToPlay: 0, pathwaySuitAfterMutation: Suit.Clubs });
    setLog([`Game Initialized: ${numberOfPlayers} players. Player 1, activate the pathway with Ligands (Clubs ♣).`]);
    setWinner(null);
    setSelectedCardId(null);
    setIsQueenEffectActive(false);
    setJokerSelection({isSelecting: false, cardId: null, requiredSuit: Suit.Clubs });
    setGameStage('playing');
  }, []); 

  const handleStartGame = () => {
    initializeGame(numPlayersInput);
  };
  
  const handleReturnToSetup = () => {
    setGameStage('setup');
    setLog([]); 
  };

  const addToLog = (message: string) => {
    setLog(prevLog => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLog.slice(0, 19)]);
    console.log(message);
  };
  
  const advanceTurn = (skippedPlayers: number = 0) => {
    if (gameStage === 'gameOver') return;
    let nextPlayer = currentPlayerIndex;
    for (let i = 0; i <= skippedPlayers; i++) {
        nextPlayer = (nextPlayer + playDirection + players.length) % players.length;
    }
    setCurrentPlayerIndex(nextPlayer);
    setSelectedCardId(null); 
    
    const nextPlayerObject = players[nextPlayer];
    if (!nextPlayerObject) return; 

    let currentTurnExpectedSuitToShow: Suit;
    if (aceMutation.isActive) {
      if (aceMutation.cardsToPlay === 0) { 
        setAceMutation(prev => ({ ...prev, isActive: false, forcedSuit: Suit.Clubs }));
        currentTurnExpectedSuitToShow = expectedSuit; 
        addToLog(`MUTATION ENDED. ${nextPlayerObject.name}'s turn. Pathway expects: ${SUIT_NAMES[currentTurnExpectedSuitToShow]}.`);
      } else {
        currentTurnExpectedSuitToShow = aceMutation.forcedSuit; 
        addToLog(`MUTATION ACTIVE: ${nextPlayerObject.name}'s turn. Play ${SUIT_NAMES[currentTurnExpectedSuitToShow]} (${aceMutation.cardsToPlay} more).`);
      }
    } else {
       currentTurnExpectedSuitToShow = expectedSuit; 
       addToLog(`${nextPlayerObject.name}'s turn. Pathway expects: ${SUIT_NAMES[currentTurnExpectedSuitToShow]}.`);
    }
  };

  const handlePlayCard = () => {
    if (!selectedCardId) {
      addToLog("Alert: No card selected for transmission.");
      return;
    }
    const player = players[currentPlayerIndex];
    const cardToPlay = player.hand.find(c => c.id === selectedCardId);

    if (!cardToPlay) {
      addToLog("Error: Selected signal (card) corrupted or missing from databank (hand).");
      return;
    }
    
    let currentRequiredSuitForJoker: Suit;
    if (aceMutation.isActive) {
        currentRequiredSuitForJoker = aceMutation.forcedSuit;
    } else if (currentPathway.length === 0) {
        currentRequiredSuitForJoker = Suit.Clubs;
    } else {
        currentRequiredSuitForJoker = expectedSuit;
    }

    if (cardToPlay.rank === Rank.Joker && !cardToPlay.declaredSuit) {
      setJokerSelection({ isSelecting: true, cardId: cardToPlay.id, requiredSuit: currentRequiredSuitForJoker });
      addToLog("Joker (Wild Mutation) selected. Declare its parameters.");
      return;
    }
    
    const actualSuit = cardToPlay.declaredSuit || cardToPlay.suit;
    const actualRank = cardToPlay.declaredRank || cardToPlay.rank;

    if (cardToPlay.isWild) { 
        if (actualSuit !== currentRequiredSuitForJoker) {
            addToLog(`Invalid Joker Declaration. Declared: ${actualSuit}, Required: ${SUIT_NAMES[currentRequiredSuitForJoker]}. Signal reset.`);
            const originalJoker = {...cardToPlay, declaredSuit: undefined, declaredRank: undefined};
            const restoredHand = player.hand.map(c => c.id === cardToPlay.id ? originalJoker : c);
            setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, hand: restoredHand } : p));
            setSelectedCardId(null);
            return;
        }
    }

    let effectiveExpectedSuit: Suit;
    if (aceMutation.isActive) {
        effectiveExpectedSuit = aceMutation.forcedSuit;
    } else if (currentPathway.length === 0) {
        effectiveExpectedSuit = Suit.Clubs;
    } else {
        effectiveExpectedSuit = expectedSuit;
    }

    if (isQueenEffectActive) {
      if (currentPathway.length === 0) { 
        addToLog("Error: Queen Scaffolding active, but pathway is empty. Resetting effect.");
        setIsQueenEffectActive(false); 
        return;
      }
      const queenCard = currentPathway.find(c => (c.declaredRank || c.rank) === Rank.Queen && players.find(p=>p.hand.some(hC => hC.id === c.id))?.id !== player.id) || currentPathway[currentPathway.length - 1];
      // Heuristic to find the queen: if multiple queens, try to find one NOT in current player's hand. Last card as fallback.
      const queenSuit = queenCard.declaredSuit || queenCard.suit;

      if (actualSuit !== queenSuit) {
         addToLog(`Queen Scaffolding: Must play ${SUIT_NAMES[queenSuit]} or select 'Finalize Scaffold'.`);
         return;
      }
      if (aceMutation.isActive && actualSuit === aceMutation.forcedSuit) {
        setAceMutation(prev => ({ ...prev, cardsToPlay: Math.max(0, prev.cardsToPlay - 1) }));
      }
    } else {
      if (actualSuit !== effectiveExpectedSuit && !cardToPlay.isWild) { 
        addToLog(`Pathway Mismatch. Expected: ${SUIT_NAMES[effectiveExpectedSuit]}, Played: ${SUIT_NAMES[actualSuit]}. Absorb pathway or play valid signal.`);
        return;
      }
    }
    
    let newHand = player.hand.filter(c => c.id !== selectedCardId);
    setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, hand: newHand } : p));
    setCurrentPathway(prev => [...prev, cardToPlay]);
    addToLog(`${player.name} transmits ${actualRank} of ${actualSuit}.`);
    
    if (newHand.length === 0) {
      checkWinCondition(player.id, newHand);
      if(gameStage === 'gameOver') return; 
    }

    let nextPlayerSkipped = 0;
    let newPlayDirection = playDirection;
    let pathwayCompletedThisTurn = false;
    let nextSuitForTurn: Suit = expectedSuit; 

    if (aceMutation.isActive) {
        if (actualSuit === aceMutation.forcedSuit) { 
            const newCardsToPlay = aceMutation.cardsToPlay - 1;
            setAceMutation(prev => ({ ...prev, cardsToPlay: newCardsToPlay }));
            if (newCardsToPlay === 0) {
                addToLog(`MUTATION: Final ${SUIT_NAMES[aceMutation.forcedSuit]} card played.`);
                nextSuitForTurn = aceMutation.pathwaySuitAfterMutation; 
                if (aceMutation.forcedSuit === Suit.Spades && aceMutation.pathwaySuitAfterMutation === Suit.Clubs) {
                     pathwayCompletedThisTurn = true; 
                }
            } else {
                addToLog(`MUTATION: ${newCardsToPlay} more ${SUIT_NAMES[aceMutation.forcedSuit]} signals required.`);
                nextSuitForTurn = aceMutation.forcedSuit; 
            }
        } else {
            nextSuitForTurn = aceMutation.forcedSuit;
        }
    }

    if (actualRank === Rank.King) {
      addToLog(`King (Inhibitor) ${actualSuit} played! Next operative's turn skipped.`);
      nextPlayerSkipped = 1;
      if (!aceMutation.isActive || aceMutation.cardsToPlay === 0) {
         nextSuitForTurn = determineNextExpectedSuit(actualSuit);
      }
    } else if (actualRank === Rank.Queen) {
      addToLog(`Queen (Scaffold) ${actualSuit} played! ${player.name} can extend with more ${SUIT_NAMES[actualSuit]}.`);
      setIsQueenEffectActive(true);
      setExpectedSuit(actualSuit); 
      return; 
    } else if (actualRank === Rank.Jack) {
      newPlayDirection = (playDirection * -1) as (1 | -1);
      setPlayDirection(newPlayDirection);
      if (!aceMutation.isActive || aceMutation.cardsToPlay === 0) {
         nextSuitForTurn = determineNextExpectedSuit(actualSuit);
      }
      const nextSuitName = SUIT_NAMES[nextSuitForTurn];
      addToLog(`Jack (Feedback Loop) ${actualSuit} played! Signal flow reversed. Next operative plays ${nextSuitName}.`);
    } else if (actualRank === Rank.Ace) {
      const forcedS = actualSuit;
      const suitAfterMutation = (actualSuit === Suit.Spades) ? Suit.Clubs : determineNextExpectedSuit(actualSuit);
      
      setAceMutation({ isActive: true, forcedSuit: forcedS, cardsToPlay: 3, pathwaySuitAfterMutation: suitAfterMutation });
      addToLog(`Ace (Mutation) ${actualSuit} played! ALERT: Next 3 signals must be ${SUIT_NAMES[forcedS]}.`);
      nextSuitForTurn = forcedS; 
    } else { 
        if (!aceMutation.isActive || aceMutation.cardsToPlay === 0) {
             nextSuitForTurn = determineNextExpectedSuit(actualSuit);
        }
    }
    
    if (!pathwayCompletedThisTurn && actualSuit === Suit.Spades && (!aceMutation.isActive || (aceMutation.forcedSuit === Suit.Spades && aceMutation.cardsToPlay === 0))) {
        pathwayCompletedThisTurn = true;
    }

    if (pathwayCompletedThisTurn) {
        addToLog(`RESPONSE ACHIEVED: Pathway ${[...currentPathway, cardToPlay].map(c=>`${c.declaredRank || c.rank} of ${c.declaredSuit || c.suit}`).join(' → ')} complete. Signals archived.`);
        setDiscardPile(prev => [...prev, ...currentPathway, cardToPlay]); 
        setCurrentPathway([]);
        nextSuitForTurn = Suit.Clubs; 
        if (aceMutation.isActive && aceMutation.forcedSuit === Suit.Spades) { 
             setAceMutation(prev => ({ ...prev, isActive: false, cardsToPlay: 0, forcedSuit: Suit.Clubs }));
        }
    }
    
    setExpectedSuit(nextSuitForTurn);
    advanceTurn(nextPlayerSkipped);
  };

  const handleJokerSelected = (suit: Suit, rank: Rank) => {
    if (!jokerSelection.cardId) return;

    const player = players[currentPlayerIndex];
    const jokerCard = player.hand.find(c => c.id === jokerSelection.cardId);
    if (!jokerCard) return;

    const updatedJoker = { ...jokerCard, declaredSuit: suit, declaredRank: rank };
    const newHand = player.hand.map(c => c.id === jokerSelection.cardId ? updatedJoker : c);
    setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, hand: newHand } : p));
    
    addToLog(`${player.name} declares Joker mutation as ${rank} of ${suit}.`);
    setJokerSelection(prev => ({ ...prev, isSelecting: false, cardId: null }));
    setSelectedCardId(jokerSelection.cardId); 
    
    setTimeout(() => {
       handlePlayCard(); 
    }, 0);
  };

  const handleTakePathway = () => {
    if (currentPathway.length === 0) {
      addToLog("Pathway clear. No signals to absorb.");
      return;
    }
    const player = players[currentPlayerIndex];
    const newHand = [...player.hand, ...currentPathway].sort((a,b) => SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit) || RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
    setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, hand: newHand } : p));
    addToLog(`${player.name} absorbs pathway: ${currentPathway.map(c => `${c.declaredRank || c.rank} of ${c.declaredSuit || c.suit}`).join(' → ')}.`);
    
    setCurrentPathway([]);
    setExpectedSuit(Suit.Clubs); 
    setAceMutation({ isActive: false, forcedSuit: Suit.Clubs, cardsToPlay: 0, pathwaySuitAfterMutation: Suit.Clubs }); 
    setIsQueenEffectActive(false); 
    advanceTurn();
  };
  
  const handleSkipTurn = () => {
    if (!currentPlayer) return;
    addToLog(`${currentPlayer.name} has no valid initiating signals and skips turn.`);
    advanceTurn();
  };

  const handleDonePlayingQueenExtras = () => {
    if (!isQueenEffectActive) return;
    setIsQueenEffectActive(false);
    
    const lastCardPlayedByQueen = currentPathway.length > 0 ? currentPathway[currentPathway.length-1] : null;
    if (!lastCardPlayedByQueen) { 
        setExpectedSuit(Suit.Clubs);
        advanceTurn();
        return;
    }
    const lastCardPlayedByQueenSuit = lastCardPlayedByQueen.declaredSuit || lastCardPlayedByQueen.suit;
    
    let nextSuitForGame: Suit;

    if (aceMutation.isActive) { 
        if (aceMutation.cardsToPlay === 0) { 
           nextSuitForGame = aceMutation.pathwaySuitAfterMutation;
           addToLog(`Queen's Scaffold complete. MUTATION ENDED. Next expected: ${SUIT_NAMES[nextSuitForGame]}.`);
        } else { 
           nextSuitForGame = aceMutation.forcedSuit;
           addToLog(`Queen's Scaffold complete. MUTATION ACTIVE: ${aceMutation.cardsToPlay} more ${SUIT_NAMES[aceMutation.forcedSuit]}.`);
        }
    } else { 
        nextSuitForGame = determineNextExpectedSuit(lastCardPlayedByQueenSuit); 
        addToLog(`Queen's Scaffold complete. Next expected: ${SUIT_NAMES[nextSuitForGame]}.`);
    }

    if (lastCardPlayedByQueenSuit === Suit.Spades && nextSuitForGame === Suit.Clubs && (!aceMutation.isActive || aceMutation.cardsToPlay === 0)) {
        addToLog(`RESPONSE ACHIEVED after Queen's turn. Signals archived.`);
        setDiscardPile(prev => [...prev, ...currentPathway]);
        setCurrentPathway([]);
    }
    
    setExpectedSuit(nextSuitForGame);
    advanceTurn();
  };

  const checkWinCondition = (playerId: string, hand: Card[]) => {
    if (hand.length === 0) {
      setWinner(playerId);
      setGameStage('gameOver');
      addToLog(`SYSTEM HALT! ${players.find(p=>p.id === playerId)?.name} has successfully transmitted all signals and WINS!`);
    }
  };
  
  const currentPlayer = players[currentPlayerIndex];
  const selectedPlayerCard = selectedCardId && currentPlayer ? currentPlayer.hand.find(c => c.id === selectedCardId) : null;
  
  const playButtonDisabled = useMemo(() => {
    if (!selectedCardId || !selectedPlayerCard || gameStage !== 'playing') return true;

    let dynamicExpectedSuit: Suit;
    if (aceMutation.isActive) {
        dynamicExpectedSuit = aceMutation.forcedSuit;
    } else if (currentPathway.length === 0) {
        dynamicExpectedSuit = Suit.Clubs;
    } else {
        dynamicExpectedSuit = expectedSuit;
    }

    if (isQueenEffectActive) {
      const queenCardInPathway = currentPathway.find(c => (c.declaredRank || c.rank) === Rank.Queen && players.find(p=>p.hand.some(hC => hC.id === c.id))?.id !== currentPlayer?.id) || (currentPathway.length > 0 ? currentPathway[0] : null) ;
       // Heuristic: find the Queen that started the effect or the first card of the pathway if it's the queen.
      if (queenCardInPathway) {
        const queenEffectSuit = queenCardInPathway.declaredSuit || queenCardInPathway.suit;
        const selectedCardActualSuit = selectedPlayerCard.declaredSuit || selectedPlayerCard.suit;
        if (selectedCardActualSuit !== queenEffectSuit) return true;
      } else return true; // Pathway should have the Queen
    } else if (!selectedPlayerCard.isWild) {
      const selectedCardActualSuit = selectedPlayerCard.suit;
      if (selectedCardActualSuit !== dynamicExpectedSuit) return true;
    } else { // Joker selected
        if(selectedPlayerCard.declaredSuit && selectedPlayerCard.declaredSuit !== dynamicExpectedSuit) {
             return true; 
        }
    }
    return false;
  }, [selectedCardId, selectedPlayerCard, gameStage, aceMutation, currentPathway, expectedSuit, isQueenEffectActive, currentPlayer, players]);


  const isPathwayEmpty = currentPathway.length === 0;
  let canPlayerStartPathway = false;
  if (isPathwayEmpty && currentPlayer && gameStage === 'playing') {
      const suitNeededToStart = aceMutation.isActive ? aceMutation.forcedSuit : Suit.Clubs;
      canPlayerStartPathway = currentPlayer.hand.some(card => 
          (card.isWild) || 
          (!card.isWild && card.suit === suitNeededToStart) 
      );
  }
  const showSkipButton = isPathwayEmpty && !canPlayerStartPathway && !isQueenEffectActive && gameStage === 'playing' && !!currentPlayer;


  if (gameStage === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-cyan-100">
        <div className="panel p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-lg text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 font-orbitron mb-8 text-shadow-cyan">CASCADE PATH</h1>
          <p className="text-slate-300 mb-8 text-lg">Configure Signal Transduction Protocol</p>
          <div className="mb-8">
            <label htmlFor="numPlayers" className="block text-xl font-medium text-cyan-200 mb-3">Number of Operatives ({MIN_PLAYERS}-{MAX_PLAYERS}):</label>
            <input 
              type="number" 
              id="numPlayers"
              value={numPlayersInput}
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) { 
                    setNumPlayersInput(val);
                } else if (e.target.value === "") { 
                    setNumPlayersInput(NaN); 
                }
              }}
              className="w-full p-3 border border-cyan-600/50 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-lg text-center bg-slate-700 text-cyan-100"
            />
          </div>
          <button 
            onClick={handleStartGame} 
            disabled={isNaN(numPlayersInput) || numPlayersInput < MIN_PLAYERS || numPlayersInput > MAX_PLAYERS}
            className="w-full px-8 py-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 font-semibold text-xl interactive-glow-button shadow-lg"
          >
            Initialize Pathway
          </button>
          { (isNaN(numPlayersInput) || numPlayersInput < MIN_PLAYERS || numPlayersInput > MAX_PLAYERS) && 
            <p className="text-pink-400 text-sm mt-3">Input operatives: {MIN_PLAYERS} to {MAX_PLAYERS}.</p>
          }
        </div>
         <div id="biology-fact-display">{currentFact}</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col items-center p-2 sm:p-4 md:p-6 text-cyan-50 selection:bg-cyan-700/50">
      <header className="w-full max-w-7xl mb-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-cyan-400 font-orbitron tracking-wider text-shadow-cyan">CASCADE PATH</h1>
        <p className="text-sm sm:text-base text-slate-300 mt-1">Cellular Signal Relay Active ({players.length} Operatives)</p>
      </header>

      {gameStage === 'gameOver' && winner && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="modal-content p-8 sm:p-10 rounded-xl shadow-2xl text-center transform transition-all scale-95 opacity-0 animate-modalPopIn">
            {/*FIX: Removed 'jsx' prop from style tag. The CSS content is standard and will be applied correctly.*/}
            <style>{` @keyframes modalPopIn { to { opacity: 1; transform: scale(1); } } .animate-modalPopIn { animation: modalPopIn 0.3s forwards; } `}</style>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-cyan-400 font-orbitron text-shadow-cyan">{players.find(p=>p.id === winner)?.name} Achieved Full Signal Transduction!</h2>
            <p className="text-slate-300 text-lg mb-6">Protocol Complete.</p>
            <button 
              onClick={handleReturnToSetup} 
              className="mt-6 px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-opacity font-semibold text-lg interactive-glow-button shadow-md"
            >
              Re-initialize Protocol
            </button>
          </div>
        </div>
      )}
      
      {jokerSelection.isSelecting && (
        <JokerModal 
            isOpen={jokerSelection.isSelecting}
            onClose={() => setJokerSelection(prev => ({ ...prev, isSelecting: false, cardId: null }))}
            onSelect={handleJokerSelected}
            requiredSuit={jokerSelection.requiredSuit}
        />
      )}


      {gameStage === 'playing' && currentPlayer && (
        <div className="w-full max-w-7xl mx-auto grid grid-cols-12 gap-4">
          {/* Left Panel: Player Hand & Actions */}
          <section className="col-span-12 lg:col-span-4 panel space-y-4">
            <div>
                <h2 className="text-2xl font-semibold mb-3 text-cyan-300 border-b-2 border-cyan-700/50 pb-2 font-orbitron">Operative: <span className="text-cyan-400">{currentPlayer.name}</span></h2>
                <div className="min-h-[12rem] bg-slate-800/50 rounded-lg p-2 sm:p-3 flex flex-wrap gap-2 items-center justify-center border border-cyan-700/30 shadow-inner">
                  {currentPlayer.hand.length === 0 && <p className="text-slate-400 p-4">Signal Databank Empty!</p>}
                  {currentPlayer.hand.map(card => (
                    <CardView 
                      key={card.id} 
                      card={card} 
                      onClick={() => setSelectedCardId(card.id)} 
                      isSelected={selectedCardId === card.id}
                    />
                  ))}
                </div>
            </div>
             <div className="space-y-3">
              <button 
                onClick={handlePlayCard} 
                disabled={playButtonDisabled}
                className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 font-medium text-lg interactive-glow-button"
              >
                Transmit Selected Signal
              </button>
               {isQueenEffectActive ? (
                <button onClick={handleDonePlayingQueenExtras} className="w-full px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-medium text-lg interactive-glow-button">
                  Finalize Scaffold
                </button>
              ) : showSkipButton ? (
                <button onClick={handleSkipTurn} className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium text-lg interactive-glow-button">
                  Bypass (No Initiator)
                </button>
              ) : (
                <button onClick={handleTakePathway} disabled={currentPathway.length === 0} className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-lg interactive-glow-button">
                  Absorb Pathway Signals
                </button>
              )}
            </div>
             <button 
              onClick={handleReturnToSetup} 
              className="mt-4 w-full px-6 py-2 bg-slate-600 text-slate-100 rounded-lg hover:bg-slate-500 transition-colors font-medium text-sm interactive-glow-button"
            >
              New Protocol (Setup)
            </button>
          </section>

          {/* Center Panel: Pathway & Game Info */}
          <section className="col-span-12 lg:col-span-5 panel flex flex-col">
             <h2 className="text-2xl font-semibold mb-3 text-cyan-300 border-b-2 border-cyan-700/50 pb-2 font-orbitron">Signaling Pathway</h2>
            <div className="min-h-[12rem] bg-slate-800/50 rounded-lg p-2 sm:p-4 flex flex-wrap gap-x-1 gap-y-2 items-center justify-center border border-cyan-700/30 shadow-inner flex-grow">
              {currentPathway.length === 0 && <p className="text-slate-400 p-4 text-center">Pathway Dormant. Transmit a {SUIT_NAMES[aceMutation.isActive && currentPathway.length === 0 ? aceMutation.forcedSuit : Suit.Clubs]} signal.</p>}
              {currentPathway.map((card, index) => (
                <React.Fragment key={`${card.id}-${index}-pathway`}>
                  {index > 0 && <span className="pathway-arrow animate-pulse">→</span>}
                  <div className="pathway-card-enter-active">
                     <CardView card={card} className="shadow-md" />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-lg"><span className="font-medium text-cyan-200">Expected Signal Type:</span> 
                  <span className="font-semibold ml-2 p-1 rounded" style={{
                      color: SUIT_NAMES[aceMutation.isActive ? aceMutation.forcedSuit : expectedSuit] === SUIT_NAMES[Suit.Clubs] ? '#66bb6a' : 
                             SUIT_NAMES[aceMutation.isActive ? aceMutation.forcedSuit : expectedSuit] === SUIT_NAMES[Suit.Diamonds] ? '#42a5f5' :
                             SUIT_NAMES[aceMutation.isActive ? aceMutation.forcedSuit : expectedSuit] === SUIT_NAMES[Suit.Hearts] ? '#ec407a' : '#ffa726'
                  }}>
                      {SUIT_NAMES[aceMutation.isActive ? aceMutation.forcedSuit : expectedSuit]}
                  </span>
              </p>
              {aceMutation.isActive && (
                 <p className="text-sm text-pink-400">MUTATION PROTOCOL: {aceMutation.cardsToPlay} more <span className="font-bold">{SUIT_NAMES[aceMutation.forcedSuit]}</span> signals required.</p>
              )}
               <p className="text-sm"><span className="font-medium text-cyan-200">Signal Flow:</span> {playDirection === 1 ? 'Anterograde ➡️' : 'Retrograde (Feedback) ⬅️'}</p>
            </div>
          </section>

          {/* Right Panel: Log & Other Players */}
          <section className="col-span-12 lg:col-span-3 panel flex flex-col">
            <h2 className="text-2xl font-semibold mb-3 text-cyan-300 border-b-2 border-cyan-700/50 pb-2 font-orbitron">System Log</h2>
            <div className="h-64 sm:h-80 overflow-y-auto bg-slate-800/50 rounded-lg p-3 space-y-1 border border-cyan-700/30 shadow-inner custom-scrollbar flex-grow">
              {log.map((entry, index) => (
                <p key={index} className={`text-xs sm:text-sm ${index === 0 ? 'text-cyan-300 font-medium' : 'text-slate-300'} even:bg-slate-700/30 px-1 rounded`}>{entry}</p>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-cyan-300 font-orbitron mb-2">Other Operatives:</h3>
               {players.filter(p => p.id !== currentPlayer?.id).map(player => (
                  <div key={player.id} className="mt-2 opacity-80">
                      <p className="text-sm text-slate-300">{player.name}: {player.hand.length} signals remaining</p>
                       <div className="flex flex-wrap gap-1 mt-1">
                          {Array(player.hand.length).fill(0).map((_, i) => (
                              <div key={`${player.id}-card-${i}`} className="w-5 h-7 bg-slate-600 rounded-sm border border-slate-500 shadow-sm"></div>
                          ))}
                      </div>
                  </div>
              ))}
            </div>
          </section>
        </div>
      )}
      { gameStage === 'playing' && !currentPlayer && players.length > 0 &&
         <div className="flex items-center justify-center min-h-screen text-3xl font-orbitron text-cyan-400">Initializing Operative Interface...</div>
      }
      <div id="biology-fact-display" className="hidden sm:block">{currentFact}</div>
    </div>
  );
};

export default App;