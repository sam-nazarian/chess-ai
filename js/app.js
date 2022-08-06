import style from '../css/chessboard-1.0.0.css';
import favicon from '../img/faviconHorse.jpg'
import chessboard from './chessboard-1.0.0.js'; //doesn't matter what we name it, not using the name
import {Chess} from 'chess.js'
import css from '../css/main.css'
import {evaluateBoard} from './ai.js'

//imoprt all images from the chesspieces folder
function importAll(r) {
  return r.keys().map(r); //run the function passed in
}
const images = importAll(require.context('../img/chesspieces/wikipedia/', false, /\.(png|jpe?g|svg)$/)); // basically does this 40 times, import k from '../img/chesspieces/wikipedia/wK.png'


//since ChessBoard name is set in the file above, we get access to it here
// var board1 = ChessBoard('board1', {
//   position: 'start',
//   draggable: true
// })


// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null
var game = new Chess() //default chess position with no parameters
let positionPoints = 0;
const progressDom = document.querySelector('.progress');

//later use game.reset() when restarting to initial position

//when highlighted, color white or black squares will turn to:
var whiteSquareGrey = '#a9a9a9' 
var blackSquareGrey = '#696969'


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
  var $square = $('#htmlBoard .square-' + square) //on hover highlights the legal moves

  // console.log($square);

  //set background color to dark gray if black, OR light gray if white
  var background = whiteSquareGrey
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

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }

  //USE WHEN YOU ONLY WANNA USE WHITE ⬜️
  // if (piece.search(/^b/) !== -1) return false
}

/**
 * Black making a move 
 */
function makeRandomMove () {
  const possibleMoves = game.moves()
  // console.log(possibleMoves);

  // game over
  if (possibleMoves.length === 0) return

  var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  game.move(possibleMoves[randomIdx])
  board.position(game.fen())


  // console.log('Black made a move',evaluateBoard(game, game.turn()));
  evaluateBoard(game, game.turn());


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

  // console.log('source', typeof source);
  // console.log('target', typeof target);

  // Make the move
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen (for simplicity)
  })
  //evaluate the board here - so that positionPoints gets updated

  // console.log(move);

  //if move was illegal it would have value of null, otherwise it will have an object containing info about that move
  // illegal move
  if (move === null) return 'snapback' //piece will return to original/source square


  // console.log(move);
  // positionPoints = evaluateBoard(game, move, positionPoints, move.color)
  // console.log(positionPoints);

  // make random legal move for black
  window.setTimeout(makeRandomMove, 250)
}

/**
 * Highlight legal moves whenever mouse enters a square
 * @param {String} square square that was entered
 * @param {String} piece The piece on that square(e.g wN), if none, then false
 * @returns 
 */
function onMouseoverSquare (square, piece) {

  //USE WHEN YOU ONLY WANNA USE WHITE ⬜️
  // if (piece === false || piece.search(/^b/) !== -1) return;

  // get list of possible moves for highlighted square
  //gets an array of objects (object includes info of possible move)
  var moves = game.moves({
    square: square, //wihtout square it would list all possible moves, for all pieces
    verbose: true //gives all legal possibilities of that piece
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
  // console.log('White Made Move:', evaluateBoard(game, game.turn())); //after white makes a move, it's black's turn
  const positionPoint = evaluateBoard(game, game.turn())
  let percentPosition = (positionPoint - (-3887)) / (3887-(-3887)) * 100;
  if(percentPosition>100) percentPosition=100;
  if(percentPosition<0) percentPosition=0;

  console.log('positionPoint', positionPoint);
  console.log('percentPosition', percentPosition );

  //END THE GAME, AND SHOW MESSAGE ON WEBSITE


  progressDom.style.height = `${percentPosition}%`; //formula to calc percentage based on max & min


  //sets curr board(UI) position to the curr game FEN
  //Neccesorly as makes sure UI & backend logic are at same position in moves such as enpasent
  board.position(game.fen());
}

var config = {
  draggable: true, //allow pieces to be dragged
  position: 'start', //position all pieces like normal chess
  onDragStart: onDragStart, //When a piece is picked up
  onDrop: onDrop, //When a piece is dropped
  onMouseoverSquare: onMouseoverSquare, //run function whenver mouse enters a square
  onMouseoutSquare: onMouseoutSquare, //when mouse leaves square
  onSnapEnd: onSnapEnd //when piece snap animation is complete
}
board = Chessboard('htmlBoard', config) //ChessBoard is a variable in chessboard-1.0.0.js