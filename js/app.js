import chessboard from './chessboard-updated'; //doesn't matter what we name it, not using the name
import {Chess} from 'chess.js'
import generalCss from '../css/general.css'
import style from '../css/chessboard-1.0.0.css';
import mainCss from '../css/main.css'
import queriesCss from '../css/queries.css'
import {evaluateBoard, minimax, minimaxDefault, calcWeight} from './ai.js'

//imoprt all images from the chesspieces folder
function importAll(r) {
  return r.keys().map(r); //run the function passed in
}

// Import audios
import moveFile from '../audio/move.mp3';
import captureFile from '../audio/capture.mp3';
import checkFile from '../audio/check.mp3';
import castleFile from '../audio/castle.mp3';
import loseFile from '../audio/lose.mp3';
import winFile from '../audio/win.mp3';
import startFile from '../audio/start.mp3';

// basically does this 40 times, import k from '../img/chesspieces/wikipedia/wK.png'
importAll(require.context('../img/chesspieces/wikipedia/', false, /\.(png|jpe?g|svg)$/));
importAll(require.context('../img/chesspieces/alpha/', false, /\.(png|jpe?g|svg)$/));
importAll(require.context('../img/board/', false, /\.(png|jpe?g|svg)$/));
importAll(require.context('../img/favicon', false, /\.(png|jpe?g|svg)$/));

/////////////////////////////

const game = new Chess() //default chess position with no parameters
const touchDevice = isTouchDevice();

// Create Audio Objects
const moveSound = new Audio(moveFile);
const captureSound = new Audio(captureFile);
const checkSound = new Audio(checkFile);
const castleSound = new Audio(castleFile);
const loseSound = new Audio(loseFile);
const winSound = new Audio(winFile);
const startSound = new Audio(startFile);

let board = null
let redoArr = [];
let userLevel = 3; //set it by user (default is 3)
let prevPosAnalyzed = 0;
let errTimeout = 0;

//DOM selectors
const progressDom = document.querySelector('.progress');
const winnerTextDom = document.querySelector('.winner-text');
const playerTurnTextDom = document.querySelector('.player-turn-text');
const whiteKingDom = document.querySelector('.white-king');
const blackKingDom = document.querySelector('.black-king');
const fenInputDom = document.querySelector('.fen-input');
const fenInputSubmitDom = document.querySelector('.fen-input-submit');
const formLoadPosDom = document.querySelector('.form-load-position');
const formDifficultyDom = document.querySelector('.form-difficulty');
const btnUndoDom = document.querySelector('.btn-undo');
const btnRedoDom = document.querySelector('.btn-redo');
const errMessageDom = document.querySelector('.err-message');
const errContainerDom = document.querySelector('.err-container');
const btnCloseErrContainerDom = document.querySelector('.btn-close-err-container');


//when highlighted, color white or black squares will turn to:
const whiteSquareGrey = '#268CCC' 
const blackSquareGrey = '#76C7E9'

/**
 * Remove highlighted gray squares (done in chessboard/UI, not using chess.js in this function)
 */
function removeGreySquares () {
  //all square classes have class 'square-55d63'
  $('#htmlBoard .square-55d63').css('background-color', '') //using jquery remove gray highlight of all squares
}

/**
 * Highlight the square given to gray (light & dark gray)
 * @param {String} square the square name eg. e2
 */
function greySquare (square) {
  const $square = $('#htmlBoard .square-' + square) //on hover highlights the legal moves

  //set background color to dark gray if black, OR light gray if white
  let background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background-color', background)
}

/**
 * Fires when a piece is picked up
 * If game is over, or it's black's turn piece can't be picked up
 * @param {String} source curr location of piece(not being used)
 * @param {String} piece name of piece, eg. wp, wK, wN, wR
 * @returns {boolean} disable drag action returns false.
 */
function onDragStart (source, piece) {
  highlightMoves(source, piece)

  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // USE BELOW WHEN YOU WANNA USE BOTH SIDES ⬜️⬛️
  /*if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }*/

  //USE BELOW WHEN YOU ONLY WANNA USE WHITE ⬜️
  //if piece is black then don't allow picking it up
  if (piece.search(/^b/) !== -1) return false
}

/**
 * Black making a move using minimaxDefault() in ai.js
 */
function makeBlackMove () {
  let resMiniMax = [];

  const [sumWeightBW] = calcWeight(game.fen(), {fenStr:true});

  //if endgame & processeing is fast then, go 5 moves deep
  if(sumWeightBW <= 121870 && prevPosAnalyzed<80000 && userLevel<5){
    resMiniMax = minimaxDefault(game, 5);
  }else{
    resMiniMax = minimaxDefault(game, userLevel);
  }

  const bestMove = resMiniMax[1];
  const posAnalyzed = resMiniMax[2];

  prevPosAnalyzed = posAnalyzed;
  // console.log(posAnalyzed);

  if(bestMove === 'nothing') return; //no move to be made

  game.move(bestMove);
  board.position(game.fen());
  if(!touchDevice) resetAndPlayAudio(bestMove);

  //now that black moved, it's white's turn
  updateUI();
}

/**
 * When a WHITE piece is dropped 
 * @param {String} source curr location of piece, eg.e2
 * @param {String} target  where piece was dropped, eg.e5
 */
function onDrop (source, target) {
  removeGreySquares()

  // Make the move
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen (for simplicity)
  })

  //if move was illegal it would have value of null, otherwise it will have an object containing info about that move
  
  // illegal move
  if (move === null) return 'snapback' //piece will return to original/source square

  if(!touchDevice) resetAndPlayAudio(move.san)

  // make move for black
  //If move is castling then wait longer since, it takes longer to preform castling animation
  if(move.san === 'O-O' || move.san === 'O-O-O') window.setTimeout(makeBlackMove, 250)
  else window.setTimeout(makeBlackMove, 100)
}

/**
 * Highlight legal moves whenever mouse clicks a piece
 * @param {String} square square that was entered
 * @param {String} piece The piece on that square(e.g wN), if none, then false
 */
function highlightMoves(square, piece){
    //USE BELOW WHEN YOU ONLY WANNA USE WHITE ⬜️ , COMMENT IT WHEN YOU WANNA USE BOTH SIDES ⬜️⬛️
    if (piece === false || piece.search(/^b/) !== -1 || game.game_over()) return;

    // get list of possible moves for highlighted square (gets an array of objects (object includes info of possible move))
    const moves = game.moves({
      square: square, //wihtout square it would list all possible moves, for all pieces
      verbose: true //gives all legal possibilities of that piece
    })
  
    // highlight the square user clicked
    greySquare(square)

    // exit if there are no moves available for this square
    if (moves.length === 0) return

    // highlight the possible squares for this piece
    for (let i = 0; i < moves.length; i++) {
      greySquare(moves[i].to)
    }
}

/**
 * After white's move is completed, update UI & board position
 */
function onSnapEnd () {
  //now that white moved, it's black's turn
  updateUI()

  //sets curr board(UI) position to the curr game FEN
  //Neccesorly as it makes sure UI & backend logic are at same position in moves such as enpassant
  board.position(game.fen());

  //reset redo arr
  redoArr = [];
}

/**
 * Resets the audios, then plays the appropriate sound based on the move
 * @param {String} move The string of move eg. Nxe4
 */
function resetAndPlayAudio(move){
  // mobileFix(); //slows down too much
  resetAudios();

    if(move.includes('+')) checkSound.play();
    else if(move.includes('x')) captureSound.play();
    else if(move.includes('O')) castleSound.play();
    else moveSound.play();
  
}

/**
 * Resets audios, so that another audio can be called after
 */
function resetAudios(){
  moveSound.pause();
  moveSound.currentTime = 0;
  captureSound.pause();
  captureSound.currentTime = 0;
  checkSound.pause();
  checkSound.currentTime = 0;
  castleSound.pause();
  castleSound.currentTime = 0;
  loseSound.pause();
  loseSound.currentTime = 0;
  winSound.pause();
  winSound.currentTime = 0;
  startSound.pause();
  startSound.currentTime = 0;
}

/**
 * returns whether or not device has touch capability
 * @returns {boolean} true if device has touchscreen capabilities, false if it doesn't
 */
function isTouchDevice() {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
}

/**
 * Updates evaluation bar based on positionPoint & Shows winner text at the end
 */
function updateUI(){

  //UPDATE EVALUATION BAR
  const positionPoint = evaluateBoard(game, game.turn())

  //formula to calc percentage based on max & min
  let percentPosition = (positionPoint - (-3887)) / (3887-(-3887)) * 100;
  if(percentPosition>100) percentPosition=100;
  if(percentPosition<0) percentPosition=0;

  progressDom.style.height = `${percentPosition}%`;

  //UDPATE WINNER TEXT
	if (game.in_checkmate()) {

    winnerTextDom.classList.add('winner-text-active');

    //if it's checkmate & white is supposed to move (so white loses)
		if (game.turn() === 'w') {
      if(!touchDevice) loseSound.play(); 
      winnerTextDom.innerHTML = 'Black Wins!';
    }

		if (game.turn() === 'b') {
      if(!touchDevice) winSound.play();
      winnerTextDom.innerHTML = 'White Wins!';
    }

    whiteKingDom.classList.add('hide')
    blackKingDom.classList.add('hide')
    playerTurnTextDom.classList.add('hide')

    return;
	}

  if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate()) {
    if(!touchDevice) winSound.play();

    winnerTextDom.classList.add('winner-text-active');

		winnerTextDom.innerHTML = 'Draw!'; //position is equal

    whiteKingDom.classList.add('hide')
    blackKingDom.classList.add('hide')
    playerTurnTextDom.classList.add('hide')

    return;
	}

  //UPDATE THE PLAYER TURN
  if (game.turn() === 'w') {
    playerTurnTextDom.innerHTML = `Your<br>Turn`;
    whiteKingDom.classList.remove('hide')
    blackKingDom.classList.add('hide')
  }

  if (game.turn() === 'b') {
    playerTurnTextDom.innerHTML = `Wait, Black<br>Is Thinking...`;
    blackKingDom.classList.remove('hide')
    whiteKingDom.classList.add('hide')
  }

}

function restartGame(){
  game.reset();
  redoArr = [];
  winnerTextDom.classList.remove('winner-text-active');
  playerTurnTextDom.classList.remove('hide');

  // make sure to call updateUI() after calling restartGame()
}

const config = {
  draggable: true, //allow pieces to be dragged
  position: 'start', //position all pieces like normal chess
  pieceTheme: 'img/chesspieces/alpha/{piece}.png',
  onDragStart: onDragStart, //When a piece is picked up
  onDrop: onDrop, //When a piece is dropped
  onSnapEnd: onSnapEnd //when piece snap animation is complete
}

board = ChessBoard('htmlBoard', config) //ChessBoard is a variable in chessboard-updated.js, already imported

// Whenever window is resized, run board.size() 
$(window).resize(board.resize);

// Prevent scrolling while clicking board in mobile devices
jQuery('#htmlBoard').on('scroll touchmove touchend touchstart contextmenu', function(e){
  e.preventDefault();
  });

fenInputSubmitDom.addEventListener('click', submitFen);
formLoadPosDom.addEventListener('submit', submitFen);

/**
 * @param {Object} e event object
 * load the fen position on game, then sync it with view
 */
function submitFen(e){
  e.preventDefault();

  restartGame();

  //load the fen position on game
  const load = game.load(fenInputDom.value)
  formLoadPosDom.reset();

  if(load === false){
    showError('Invalid FEN!')
    return;
  }

  redoArr = [];

  if(!touchDevice) {
    resetAudios();
    startSound.play();
  }

  // sync fen position with view
  board.position(game.fen());

  updateUI();

  //if it's black's turn -> make black move
  if(!game.fen().includes('w')) window.setTimeout(makeBlackMove, 350)

}

/**
 * Set userLevel based on selected form difficulty
 */
formDifficultyDom.addEventListener('click',(e)=>{
  //select correct target
  if(!e.target.value) return;

  userLevel = e.target.value * 1; //convert to number
})

/**
 * Undo, restore previous undo, update board position & update redoArr
 */
btnUndoDom.addEventListener('click',(e)=>{
  e.preventDefault();

  if(game.game_over() === true){
    showError(`Can't undo, game is over!`)
    return;
  }

  //if there's nothing to undo or only half a move to undo, which would mean that black did the first move (fixes bug when loading fen position when black moves first)
  if(game.history().length === 0 || game.history().length === 1) {
    showError('Nothing to undo!')
    return; //if it's null stop
  }

  //waits while black, makes the moves then undos, so it will always be white's turn after the undo
  const blackUndo = game.undo(); //undos black
  const whiteUndo = game.undo(); //undos white

  redoArr.push([blackUndo.from, blackUndo.to,whiteUndo.from, whiteUndo.to])

  board.position(game.fen());
})

/**
 * Redo, go to last move, update board position & update redoArr
 */
btnRedoDom.addEventListener('click',(e)=>{
  e.preventDefault();

  if(game.game_over() === true){
    showError(`Can't redo, game is over!`)
    return;
  }

  if(redoArr.length === 0) {
    showError('Nothing to redo!')
    return;
  }

  const redo = redoArr.pop()

  //White makes move
  game.move({
    from: redo[2],
    to: redo[3],
    promotion: 'q' // NOTE: always promote to a queen (for simplicity)
  })

  //Black makes move
  game.move({
    from: redo[0],
    to: redo[1],
    promotion: 'q' // NOTE: always promote to a queen (for simplicity)
  })

  board.position(game.fen());
})

/**
 * Display err using err-container popup at the top of the page
 * @param {String} text 
 */
function showError(text){

  if(errTimeout>0) clearTimeout(errTimeout); //remove timer if it was already set below (which would have a val>0)

  errMessageDom.innerHTML = text;

  errContainerDom.classList.add('err-container-active');

  errTimeout = window.setTimeout(()=>{
    errContainerDom.classList.remove('err-container-active')
  }, 2000) //errTimeout will be a posetive val

  // console.log(errTimeout); //default var is 0, after setTimeout() var gets set to a value greater than 0
}

// Removed close error button (uncomment if you want to add it)
/*
btnCloseErrContainerDom.addEventListener('click',(e)=>{
  errContainerDom.classList.remove('err-container-active')
})
*/

// Removed function which was called in resetAndPlayAudio(), however it slowed mobile devices down too much, thus it was removed
/*
function mobileFix(){
  moveSound.play();
  moveSound.pause();
  moveSound.currentTime = 0;

  captureSound.play();
  captureSound.pause();
  captureSound.currentTime = 0;

  checkSound.play();
  checkSound.pause();
  checkSound.currentTime = 0;

  castleSound.play();
  castleSound.pause();
  castleSound.currentTime = 0;

  loseSound.play();
  loseSound.pause();
  loseSound.currentTime = 0;

  winSound.play();
  winSound.pause();
  winSound.currentTime = 0;

  startSound.play();
  startSound.pause();
  startSound.currentTime = 0;
}
*/