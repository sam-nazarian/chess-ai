import style from '../css/chessboard-1.0.0.css';
import $ from 'jquery';
// var $ = require( "jquery" );


import chessboard from './chessboard-1.0.0.js';
import {Chess} from 'chess.js'

//imoprt all images from the chesspieces folder
function importAll(r) {
  return r.keys().map(r); //run the function passed in
}
// basically does this 40 times, import k from '../img/chesspieces/wikipedia/wK.png'
const images = importAll(require.context('../img/chesspieces/wikipedia/', false, /\.(png|jpe?g|svg)$/));


//since ChessBoard name is set in the file above, we get access to it here
// var board1 = ChessBoard('board1', {
//   position: 'start',
//   draggable: true
// })


// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null
var game = new Chess() //default chess position with no parameters

//when highlighted, color white or black squares will turn to:
var whiteSquareGrey = '#a9a9a9' 
var blackSquareGrey = '#696969'


//done in chessboard/UI (not using chess.js in this function)
function removeGreySquares () {
  $('#htmlBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#htmlBoard .square-' + square) //on hover highlights the legal moves 

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
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

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

/**
 * When a piece is dropped 
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

  // console.log(move);

  //if move was illegal it would have value of null, otherwise it will have an object containing info about that move
  // illegal move
  if (move === null) return 'snapback' //piece will return to original/source square
}

/**
 * Highlight legal moves whenever mouse enters a square
 * @param {String} square square that was entered
 * @param {String} piece The piece on that square(e.g wN), if none, then false
 * @returns 
 */
function onMouseoverSquare (square, piece) {

  // get list of possible moves for highlighted square
  var moves = game.moves({
    square: square, //wihtout square it would list all possible moves, for all pieces
    verbose: true //gives all legal possibilities of that piece
  })

  // console.log(moves);

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
  board.position(game.fen())
}

var config = {
  draggable: true, //allow pieces to be dragged
  position: 'start', //position all pieces like normal chess
  onDragStart: onDragStart, //When a piece is picked up
  onDrop: onDrop, //When a piece is dropped
  onMouseoverSquare: onMouseoverSquare, //run function whenver mouse enters a square
  onMouseoutSquare: onMouseoutSquare, //when mouse leaves square
  onSnapEnd: onSnapEnd
}
board = Chessboard('htmlBoard', config)