import style from '../css/chessboard-1.0.0.css';
import favicon from '../img/faviconHorse.jpg'
import chessboard from './chessboard-updated'; //doesn't matter what we name it, not using the name
import {Chess} from 'chess.js'
import generalCss from '../css/general.css'
import mainCss from '../css/main.css'
import {evaluateBoard, minimax, minimaxDefault, calcWeight} from './ai.js'

//imoprt all images from the chesspieces folder
function importAll(r) {
  return r.keys().map(r); //run the function passed in
}
const wikipediaPieces = importAll(require.context('../img/chesspieces/wikipedia/', false, /\.(png|jpe?g|svg)$/)); // basically does this 40 times, import k from '../img/chesspieces/wikipedia/wK.png'
const alphaPieces = importAll(require.context('../img/chesspieces/alpha/', false, /\.(png|jpe?g|svg)$/));

// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

let board = null
const game = new Chess() //default chess position with no parameters
let redoArr = [];

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
const whiteSquareGrey = '#a9a9a9' 
const blackSquareGrey = '#696969'

//done in chessboard/UI (not using chess.js in this function)
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

  // console.log($square);

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
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // console.log(game.turn());

  // USE WHEN YOU WANNA USE BOTH SIDES ⬜️⬛️
  // if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
  //     (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
  //   return false
  // }

  //USE WHEN YOU ONLY WANNA USE WHITE ⬜️
  if (piece.search(/^b/) !== -1) return false
}


let userLevel = 3; //set it by user
let prevPosAnalyzed = 0;

/**
 * Black making a move 
 */
function makeRandomMove () {
  let resMiniMax = [];

  const [sumWeightBW] = calcWeight(game.fen(), {fenStr:true});

  //if endgame & processeing is fast then, go 6 moves deep
  if(sumWeightBW <= 121870 && prevPosAnalyzed<80000 && userLevel<5){
    //[maxVal, bestMove, posAnalyzed]
    resMiniMax = minimaxDefault(game, 5);
  }else{
    resMiniMax = minimaxDefault(game, userLevel);
  }

  const bestMove = resMiniMax[1];
  const posAnalyzed = resMiniMax[2];

  prevPosAnalyzed = posAnalyzed;
  console.log(posAnalyzed);



  if(bestMove === 'nothing') return;
  game.move(bestMove)
  board.position(game.fen())
  updateUI()

  //now that black moved it's wnite's turn
}

/**
 * When a WHITE piece is dropped 
 * @param {String} source curr location of piece, eg.e2
 * @param {String} target  where piece was dropped, eg.e5
 * @returns 
 */
function onDrop (source, target) {
  removeGreySquares()

  // Make the move
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen (for simplicity)
  })
  //evaluate the board here - so that positionPoints gets updated

  //if move was illegal it would have value of null, otherwise it will have an object containing info about that move
  // illegal move
  if (move === null) return 'snapback' //piece will return to original/source square


  // console.log(move);
  // positionPoints = evaluateBoard(game, move, positionPoints, move.color)
  // console.log(positionPoints);

  // make random legal move for black
  window.setTimeout(makeRandomMove, 100) //LOWER THIS LATER
}

/**
 * Highlight legal moves whenever mouse enters a square
 * @param {String} square square that was entered
 * @param {String} piece The piece on that square(e.g wN), if none, then false
 * @returns 
 */
function onMouseoverSquare (square, piece) {

  //USE WHEN YOU ONLY WANNA USE WHITE ⬜️ , COMMENT WHEN YOU WANNA USE BOTH SIDES ⬜️⬛️
  if (piece === false || piece.search(/^b/) !== -1 || game.game_over()) return;

  // get list of possible moves for highlighted square
  //gets an array of objects (object includes info of possible move)
  const moves = game.moves({
    square: square, //wihtout square it would list all possible moves, for all pieces
    verbose: true //gives all legal possibilities of that piece
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (let i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
  // console.log('White Made Move:', evaluateBoard(game, game.turn())); //after white makes a move, it's black's turn
  updateUI()

  //sets curr board(UI) position to the curr game FEN
  //Neccesorly as makes sure UI & backend logic are at same position in moves such as enpasent
  board.position(game.fen());
}

/**
 * {void} 
 * updates evaluation bar based on positionPoint
 * how winner text at the end
 */
function updateUI(){

  // const posTestPoint = calcWeightTest(game.fen());
  // console.log(posTestPoint);

  // console.log( calcWeightBothSidesTest(game.fen()) );

  // console.log(  )


  //UPDATE UI
  const positionPoint = evaluateBoard(game, game.turn())

  // console.log(positionPoint);

  let percentPosition = (positionPoint - (-3887)) / (3887-(-3887)) * 100;
  if(percentPosition>100) percentPosition=100;
  if(percentPosition<0) percentPosition=0;

  // console.log('positionPoint', positionPoint);
  // console.log('percentPosition', percentPosition );

  progressDom.style.height = `${percentPosition}%`; //formula to calc percentage based on max & min



  //UDPATE WINNER TEXT
	if (game.in_checkmate()) {
    // if(winnerTextDom.classList.contains('winner-text-active')) return; //exit function if there was already a winner

    winnerTextDom.classList.add('winner-text-active');

		if (game.turn() === 'w') winnerTextDom.innerHTML = 'Black Wins!'; //if it's checkmate & white is supposed to move (so white loses)
		if (game.turn() === 'b') winnerTextDom.innerHTML = 'White Wins!';


    whiteKingDom.classList.add('hide')
    blackKingDom.classList.add('hide')
    playerTurnTextDom.classList.add('hide')

    return;
	}

  if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate()) {

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

const config = {
  draggable: true, //allow pieces to be dragged
  position: 'start', //position all pieces like normal chess
  pieceTheme: 'img/chesspieces/alpha/{piece}.png',
  onDragStart: onDragStart, //When a piece is picked up
  onDrop: onDrop, //When a piece is dropped
  onMouseoverSquare: onMouseoverSquare, //run function whenver mouse enters a square
  onMouseoutSquare: onMouseoutSquare, //when mouse leaves square
  onSnapEnd: onSnapEnd //when piece snap animation is complete
}

// const board = Chessboard('htmlBoard', config) //ChessBoard is a variable in chessboard-1.0.0.js already imported
board = ChessBoard('htmlBoard', config) //ChessBoard is a variable in chessboard-1.0.0.js already imported

fenInputSubmitDom.addEventListener('click', submitFen);
formLoadPosDom.addEventListener('submit', submitFen)


function submitFen(e){
  e.preventDefault();

  //load the fen position on game
  //then sync it view
  const ans = game.load(fenInputDom.value)
  formLoadPosDom.reset();

  if(ans === false){
    showError('Invalid FEN!')
    return;
  }

  redoArr = [];

  //if it's black's turn -> make black move
  if(game.fen().includes('b')) window.setTimeout(makeRandomMove, 250)

  board.position(game.fen());
}

formDifficultyDom.addEventListener('click',(e)=>{
  // console.log(e.target);
  // console.log(e.target.tagName);

  //select correct target
  if(!e.target.value) return;

  userLevel = e.target.value;
})

btnUndoDom.addEventListener('click',(e)=>{
  e.preventDefault();

  //waits while black, makes the moves then undos, so it will always be white's turn after the undo

  const blackUndo = game.undo(); //undos black
  const whiteUndo = game.undo(); //undos white
  if(!whiteUndo) {
    showError('Nothing to undo!')
    return; //if it's null stop
  }

  redoArr.push([blackUndo.from, blackUndo.to,whiteUndo.from, whiteUndo.to])

  board.position(game.fen());
})


btnRedoDom.addEventListener('click',(e)=>{
  e.preventDefault();
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

let errTimeout = 0;
function showError(text){

  if(errTimeout>0) clearTimeout(errTimeout); //remove timer if it was already set below (which would have a val>0)

  errMessageDom.innerHTML = text;

  errContainerDom.classList.add('err-container-active');

  errTimeout = window.setTimeout(()=>{
    errContainerDom.classList.remove('err-container-active')
  }, 2000) //errTimeout will be a posetive val

  console.log(errTimeout);
}


// Removed close error button
/*
btnCloseErrContainerDom.addEventListener('click',(e)=>{
  errContainerDom.classList.remove('err-container-active')
})
*/


// function getInputValue(){
//   // Selecting the input element and get its value 
  
//   // Displaying the value
//   alert(inputVal);
// }