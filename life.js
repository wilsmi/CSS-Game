/*
The universe of the Game of Life is an infinite two-dimensional orthogonal grid of square cells, each of which is in one of two possible states, alive or dead, or "populated" or "unpopulated" (the difference may seem minor, except when viewing it as an early model of human/urban behaviour simulation or how one views a blank space on a grid). Every cell interacts with its eight neighbours, which are the cells that are horizontally, vertically, or diagonally adjacent.

At each step in time, the following transitions occur:
  1. Any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
  2. Any live cell with two or three live neighbours lives on to the next generation.
  3. Any live cell with more than three live neighbours dies, as if by overpopulation.
  4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

https://en.wikipedia.org/wiki/Conway's_Game_of_Life
*/


function $(selector, container) {
    return (container || document).querySelector(selector);
}

// Model/logic of the game
(function () {
    'use strict';

    var _ = self.Life = function (seed) {
        this.seed = seed;
        this.height = seed.length;
        this.width = seed[0].length;

        this.prevBoard = [];
        this.board = cloneArray(seed);
    };

    _.prototype = {
        next: function () {
            // Clones the array and transfers it to the previous board
            this.prevBoard = cloneArray(this.board);

            // Rows first because the first column in 'game is the row
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var neighbors = this.aliveNeighbors(this.prevBoard, x, y);
                    //console.log(y, x, ':', neighbors);
                    var alive = !!this.board[y][x] // !! converts to boolean

                    if (alive) {
                        if (neighbors < 2 || neighbors > 3) {
                            this.board[y][x] = 0;
                        }
                    } else {
                        if (neighbors == 3) {
                            this.board[y][x] = 1;
                        }
                    }
                }
            }
        },

        aliveNeighbors: function (array, x, y) {
            var prevRow = array[y - 1] || [];
            var nextRow = array[y + 1] || [];

            return [
                // Three squares above current square
                prevRow[x - 1], prevRow[x], prevRow[x + 1],
                // Squares left & right of current square
                array[y][x - 1], array[y][x + 1],
                // Row underneath the current square element
                nextRow[x - 1], nextRow[x], nextRow[x + 1]
            ].reduce(function (prev, cur) {
                //+!!undefined === 0 - we can add up the numbers to determine which neighbors are still alive
                return prev + +!!cur;
            }, 0);
        },

        toString: function () {
            return this.board.map(function (row) {
                return row.join(' ');
            }).join('\n');
        }
    };

    // Helper functions
    // Warning: ONLY clones 2D arrays
    function cloneArray(array) {
        return array.slice().map(function (row) {
            return row.slice();
        });
    }

})();

// Table reflecting the status of the game (View)
(function () {
    var _ = self.LifeView = function (table, size) {
        this.grid = table;
        this.size = size;
        this.started = false;
        this.autoplay = false;
        this.createGrid();
    };

    _.prototype = {
        createGrid: function () {
            // A non-visible part of the DOM to minimize performance hits
            //is used so that all of the work can be accomplished in the fragment then sent to the DOM
            var me = this;
            var fragment = document.createDocumentFragment();
            this.grid.innerHTML = ""; // Clears the table
            this.checkboxes = [];

            for (var y = 0; y < this.size; y++) {
                var row = document.createElement('tr');
                this.checkboxes[y] = [];

                for (var x = 0; x < this.size; x++) {
                    var cell = document.createElement('td');
                    var checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    this.checkboxes[y][x] = checkbox;

                    cell.appendChild(checkbox);
                    row.appendChild(cell);
                }

                fragment.appendChild(row);
            }

            // Anytime someone interacts with a checkbox this stops the game
            this.grid.addEventListener('change', function (evt) {
                if (evt.target.nodeName.toLowerCase() == 'input') {
                    me.started = false;
                }
            })

            this.grid.appendChild(fragment);
        },

        get boardArray() {
            return this.checkboxes.map(function (row) {
                return row.map(function (checkbox) {
                    return +checkbox.checked // default bool: + converts to number
                })
            });
        },

        play: function () {
            //creates a seed from the checkboxes we have
            // which will create an array from our checkboxes, hence this.checkboxes
            this.game = new Life(this.boardArray);
            this.started = true;
        },

        next: function () {
            var me = this;
            if (!this.started || this.game) {
                this.play();
            }

            this.game.next();

            var board = this.game.board;
            // Modifying the state of the existing checkboxes
            // Returns 2D array of the board status
            for (var y = 0; y < this.size; y++) {
                for (var x = 0; x < this.size; x++) {
                    this.checkboxes[y][x].checked = !!board[y][x];
                }
            }

            // Everytime next runs, if it's autoplaying it schedules the next time it should run
            // FIXME:[] Every time I press the button it re-runs this function and doubles the time
            if (this.autoplay) {
                this.timer = setTimeout(function () {
                    me.next();
                }, 1000)
            }
        }
    };
})();

var lifeView = new LifeView(document.getElementById('grid'), 12);

(function () {

    var buttons = {
            next: $('button.next')
        }
        // Controller buttons that are wired to the view
    buttons.next.addEventListener('click', function () {
        lifeView.next();
    });

    $('#autoplay').addEventListener('change', function () {
        buttons.next.textContent = this.checked ? 'Start' : 'Next';

        lifeView.autoplay = this.checked;

        if (!this.checked) {
            clearTimeout(lifeView.timer);
        }
    });
})();
