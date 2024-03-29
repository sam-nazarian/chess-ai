import {Chess} from 'chess.js'

/*
 * Piece Square Tables, adapted from Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */

const weights = { p: 100, n: 280, b: 320, r: 479, q: 929, k: 60000, k_e: 60000 };
var pst_w = {
  p: [
    [100, 100, 100, 100, 105, 100, 100, 100],
    [78, 83, 86, 73, 102, 82, 85, 90],
    [7, 29, 21, 44, 40, 31, 44, 7],
    [-17, 16, -2, 15, 14, 0, 15, -13],
    [-26, 3, 10, 9, 6, 1, 0, -23],
    [-22, 9, 5, -11, -10, -2, 3, -19],
    [-31, 8, -7, -37, -36, -14, 3, -31],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-66, -53, -75, -75, -10, -55, -58, -70],
    [-3, -6, 100, -36, 4, 62, -4, -14],
    [10, 67, 1, 74, 73, 27, 62, -2],
    [24, 24, 45, 37, 33, 41, 25, 17],
    [-1, 5, 31, 21, 22, 35, 2, 0],
    [-18, 10, 13, 22, 18, 15, 11, -14],
    [-23, -15, 2, 0, 2, 0, -23, -20],
    [-74, -23, -26, -24, -19, -35, -22, -69],
  ],
  b: [
    [-59, -78, -82, -76, -23, -107, -37, -50],
    [-11, 20, 35, -42, -39, 31, 2, -22],
    [-9, 39, -32, 41, 52, -10, 28, -14],
    [25, 17, 20, 34, 26, 25, 15, 10],
    [13, 10, 17, 23, 17, 16, 0, 7],
    [14, 25, 24, 15, 8, 25, 20, 15],
    [19, 20, 11, 6, 7, 6, 20, 16],
    [-7, 2, -15, -12, -14, -15, -10, -10],
  ],
  r: [
    [35, 29, 33, 4, 37, 33, 56, 50],
    [55, 29, 56, 67, 55, 62, 34, 60],
    [19, 35, 28, 33, 45, 27, 25, 15],
    [0, 5, 16, 13, 18, -4, -9, -6],
    [-28, -35, -16, -21, -13, -29, -46, -30],
    [-42, -28, -42, -25, -25, -35, -26, -46],
    [-53, -38, -31, -26, -29, -43, -44, -53],
    [-30, -24, -18, 5, -2, -18, -31, -32],
  ],
  q: [
    [6, 1, -8, -104, 69, 24, 88, 26],
    [14, 32, 60, -10, 20, 76, 57, 24],
    [-2, 43, 32, 60, 72, 63, 43, 2],
    [1, -16, 22, 17, 25, 20, -13, -6],
    [-14, -15, -2, -5, -1, -10, -20, -22],
    [-30, -6, -13, -11, -16, -11, -16, -27],
    [-36, -18, 0, -19, -15, -15, -21, -38],
    [-39, -30, -31, -13, -31, -36, -34, -42],
  ],
  k: [
    [4, 54, 47, -99, -99, 60, 83, -62],
    [-32, 10, 55, 56, 56, 55, 10, 3],
    [-62, 12, -57, 44, -67, 28, 37, -31],
    [-55, 50, 11, -4, -19, 13, 0, -49],
    [-55, -43, -52, -28, -51, -47, -8, -50],
    [-47, -42, -43, -79, -64, -32, -29, -32],
    [-4, 3, -14, -50, -57, -18, 13, 4],
    [17, 30, -3, -14, 6, -1, 40, 18],
  ],

  // Endgame King Table
  k_e: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ],
};
var pst_b = {
  p: pst_w['p'].slice().reverse(),
  n: pst_w['n'].slice().reverse(),
  b: pst_w['b'].slice().reverse(),
  r: pst_w['r'].slice().reverse(),
  q: pst_w['q'].slice().reverse(),
  k: pst_w['k'].slice().reverse(),
  k_e: pst_w['k_e'].slice().reverse(),
};

/**
 * Evaluates the board at this point in time,
 * using the material weights and piece square tables.
 * 
 * @param {obj} game chess obj eg. game = new Chess()
 * @param {String} turn 'b'(black / computer) or 'w'(white)
 * @returns {Number} positionPoint value of position, posetive is good for white, negative is bad for black
 **/
export function evaluateBoard(game, turn) {

	let positionPoint = 0

	if (game.in_checkmate()) {
		if (turn === 'w') return -(10 ** 10); //if it's checkmate & white is supposed to move (so white loses)
		if (turn === 'b') return (10 ** 10);
	}

	if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate()) {
		return 0; //position is equal
	}

	// If the side to move is in check
	if (game.in_check()) {
		if (turn === 'w') positionPoint -= 50;  //white is in check
		if (turn === 'b') positionPoint += 50;  //black is in check
	}

	const fenArr = game.fen().split(/([^\s]+)/)[1].split('/');
  positionPoint += calcWeightAndPosition(fenArr);
   
	return positionPoint;
}

/**
 * Calculates positionPoint based on weight of pieces & their respective positions on the board. Used by evaluateBoard()
 * @param {Array} fenArr fen as an array, forexample "rnbqkbnr/pppp1ppp/8/4p3/8/4P3/PPPP1PPP/RNBQKBNR w KQkq e6 0 2" 
 * would be ['rnbqkbnr', 'pppp1ppp', '8', '4p3', '8', '4P3', 'PPPP1PPP', 'RNBQKBNR']
 * @returns {number} positionPoint
 */
function calcWeightAndPosition(fenArr){
  const [whiteAndBlackWeightSum, difference] = calcWeight(fenArr);
  let positionPoint = difference;

  for(let i=0; i<fenArr.length; i++){
    let col = 0;
    for(let j=0; j<fenArr[i].length; j++){

      /** @type String*/
      const char = fenArr[i][j];

      //CHAR IS WHITE
      if(char === char.toUpperCase() && isNaN(char)){
        //Change calculation for king (k) to king ending (k_e) if weight is less than a certain amount
        if(char === 'K' && whiteAndBlackWeightSum <= 121870) {
          positionPoint += pst_w['k_e'][i][col]
        }
        else{
          positionPoint += pst_w[char.toLowerCase()][i][col];
        }
      }

      //CHAR IS BLACK
      if(char === char.toLowerCase() && isNaN(char)){
        if(char === 'k' && whiteAndBlackWeightSum <= 121870) {
          positionPoint -= pst_b['k_e'][i][col]
        }
        else{
          positionPoint -= pst_b[char.toLowerCase()][i][col];
        }
      }

      //IF CHAR IS NUMBER
      if(parseInt(char)) {
        // console.log(char);
        col += char * 1;
      }else{
        col++;
      }

    }
  }

  return positionPoint;
}

/**
 * Calculates weight of pieces that white and black have
 * @param {String | Array} fen Default is a fenArr, forexample ['rnbqkbnr', 'pppp1ppp', '8', '4p3', '8', '4P3', 'PPPP1PPP', 'RNBQKBNR'], if string is passed in, 'fenStr=true' 
 * must be passed in the option parameter.
 * @param {obj} options if fenStr = true, then convert fenStr to fenArr, default is false, which means an arr was sent instead of a string for fen
 * @returns [whiteAndBlackWeightSum, difference], white and black pieces weight sum, and their difference
 */
export function calcWeight(fen, options) {

  let fenArr = fen; //by default assume an arr was given to fen
  if(options && options.fenStr === true) fenArr = fen.split(/([^\s]+)/)[1].split('/'); //if option 'fenStr' is given, convert fen to arr, and store it

  let whiteWeight = 0;
  let blackWeight = 0;

  for (let i = 0; i < fenArr.length; i++) {

    for (let j = 0; j < fenArr[i].length; j++) {
      const char = fenArr[i][j];

      if(char === char.toUpperCase() && isNaN(char)){
        //if it's WHITE
        whiteWeight += weights[char.toLowerCase()];
      }

      if(char === char.toLowerCase() && isNaN(char)){
        //if it's BLACK
        blackWeight += weights[char.toLowerCase()];
      }
      
      //there's nothing to skip as the number(in Fen) does not repeat
    }
  }

  const whiteAndBlackWeightSum = whiteWeight + blackWeight;
  const difference = whiteWeight - blackWeight;

  // console.log('whiteWeight', whiteWeight);
  // console.log('blackWeight', blackWeight);
  
  return [whiteAndBlackWeightSum, difference]
}

/**
 * acts like a namespace, that just calls minimax, with default vals, allows count to be set to 0, every time func is called
 * @param {object} game 
 * @param {number} depthAmount how many moves to look a head 
 * @returns [maxVal, bestMove, numOfPosAnalyzed]
 */
export function minimaxDefault(game, maxLevel) {
  let count = 0;
  const [maxVal, bestMove] = minimax(game, false, 'nothing', maxLevel, -Infinity, Infinity); //will see 3 moves ahead, (2 to 0, is 3 moves)
  // console.log(count);

  return [maxVal, bestMove, count];

  /**
   * Used by AI/black to find best possible move using minimax algorithm
   * @param {object} game Chess object (game = new chess())
   * @param {boolean} isMaximizing black is attempting to maximize the positionPoint, white is maximizing the positionPoint
   * @param {string} bestMove bestMove to make
   * @param {number} level levels to go down
   * 
   * @returns {array} [maxVal, bestMove]
   */
  function minimax(game, isMaximizing, bestMoveParam, level, alpha, beta) {
    //base case
    if (level === 0 || game.game_over()) {
      count++;
      // console.log(count);
      return [evaluateBoard(game, game.turn()), bestMoveParam]
    }

    //we're maximizing player
    if (isMaximizing === true) {
      let maxEval = -Infinity; //worst possible val

      //get all possible legal moves for white
      /** @type array */
      // const possibleMoves = game.moves()
      const possibleMoves = movesOrderedByImportance(game)      //SORT THE MOVES HERE

      for (let i = 0; i < possibleMoves.length; i++) {

        let bestMove = '';
        if (level === maxLevel) bestMove = possibleMoves[i]; //if we just made move (at the top level), store name of that move, as the engine needs to make one of those moves
        if (level !== maxLevel) bestMove = bestMoveParam;

        //copy old game, add new random move
        const copyGame = new Chess(game.fen());
        copyGame.move(possibleMoves[i])


        const [evalRes, possibleBestMove] = minimax(copyGame, false, bestMove, level - 1, alpha, beta);

        if (evalRes > maxEval) {
          maxEval = evalRes;
          bestMoveParam = possibleBestMove;
        }

        // alpha beta proning
        // setting alpha val for next coming children(in loop).
        // going down in recursive inherits the alpha val(from parameters), but going up doesn't inherit alpha val(from parameters) (the return can change the alpha val, but doesn't inherit from parameters)
        alpha = Math.max(alpha, evalRes);
        //alpha is only gonna get bigger, beta is only gonna get smaller, we may need a bigger val, but val only gets smaller
        if (beta <= alpha) break; 
      }

      // console.log(bestMoveParam);
      return [maxEval, bestMoveParam];
    }

    //we're minimizing here
    if (isMaximizing === false) {
      let minEval = +Infinity;

      //get all possible legal moves for black
      // const possibleMoves = game.moves()
      /** @type array */
      const possibleMoves = movesOrderedByImportance(game)


      for (let i = 0; i < possibleMoves.length; i++) {

        let bestMove = '';
        if (level === maxLevel) bestMove = possibleMoves[i]; //if we just made move
        if (level !== maxLevel) bestMove = bestMoveParam;

        //copy old game, add new random move
        const copyGame = new Chess(game.fen());
        copyGame.move(possibleMoves[i])


        const [evalRes, possibleBestMove] = minimax(copyGame, true, bestMove, level - 1, alpha, beta);

        if (evalRes < minEval) {
          minEval = evalRes;
          bestMoveParam = possibleBestMove; //this is only neccesorly for level 3(maxLevel) node as, bestMoveParam is set to 'nothing' there
        }

        //alpha beta proning
        beta = Math.min(beta, evalRes);
        //We may need a smaller val, but val only gets bigger
        if (beta <= alpha) break;
      }

      // console.log(bestMoveParam);
      return [minEval, bestMoveParam];
    }

  }

  /**
   * Create an arr of all legal moves that is sorted based on the most iimport moves (checkmates, takes, & checks) in order respectively
   * @param {object} game Chess object (game = new chess())
   */
  function movesOrderedByImportance(game) {
    let entireArr = game.moves();

    //order of importance is from 1(highest) to 3(lowest)
    const arr1 = [];
    const arr2 = [];
    const arr3 = [];
    const arr4 = [];

    for (let i = 0; i<entireArr.length; i++) {
      /** @type String */
      const move = entireArr[i];
      // console.log(move);

      if (move.includes('#')) arr1.push(move)
      else if (move.includes('x')) arr2.push(move)
      else if (move.includes('+')) arr3.push(move)
      else arr4.push(move); //every other move
    }

    // console.log(arr1);
    // console.log(arr2);
    // console.log(arr3);
    // console.log(arr4);

    entireArr = arr1.concat(arr2).concat(arr3).concat(arr4);
    return entireArr;
  }
}
