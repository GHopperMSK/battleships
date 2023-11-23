import Cell from '../common/Cell'
import Position from '../common/Position'
import Ship from '../common/Ship'
import ShipSection from '../common/ShipSection'
import ShipTypeAbstract from '../common/ShipTypeAbstract'
import AbstractGrid from '../common/AbstractGrid'

class Grid extends AbstractGrid
{
    static iter: number = 0

    static initGrid(col: number, row: number): Grid {
        const grid: Cell[][] = [];
        for (var r: number = 0; r < row; r++) {
            const rowItems: Cell[] = []
            for (var c: number = 0; c < col; c++) {
                const p = new Position(c, r)
                rowItems[c] = new Cell(p)
            }
            grid[r] = rowItems
        }

        return new Grid(grid)
    }

    typesOnly(): number[][] {
        const grid: number[][] = []
        for (var r = 0; r < this.cells.length; r++) {
            const row: number[] = []
            for (var c = 0; c < this.cells[r].length; c++) {
                row[c] = this.cells[r][c].getType()
            }
            grid[r] = row
        }

        return grid
    }

    placeShipWithSurrounding(ship: Ship): void {
        ship.sections.forEach((section: ShipSection) => {
            const cell = this.getCell(section.position)
            const type: number = section.isAlive ? Cell.CELL_TYPE_SHIP : Cell.CELL_TYPE_WRACKAGE
            cell.setType(type)
        }, this)

        const surrounding = ship.getSurrounding()
        for (const s of surrounding) {
            if (this.doesCellExist(s)) {
                this.getCell(s).setType(Cell.CELL_TYPE_WATER)
            }
        }
    }

    canPlace(ship: Ship): boolean {
        for (const section of ship.sections) {
            if (!this.doesCellExist(section.position)) {
                return false
            }

            const cell = this.getCell(section.position)
            if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
                return false
            }
        }

        return true
    }

    static findShipsCombination(col: number, row: number, shipsToPlace: ShipTypeAbstract[]): Ship[]|null {
        // TODO: order shipsToPlace by size desc
        Grid.iter = 0

        var ships: Ship[]|null
        try {
            ships = Grid.placeShips(col, row, [], shipsToPlace)
        } catch (e) {
            // took too long to find the combination
            return null
        }

        return ships
    }

    static placeShips(col: number, row: number, placedShips: Ship[], shipsToPlace: ShipTypeAbstract[]): Ship[]|null {
        Grid.iter++
        if (shipsToPlace.length === 0) {
            return placedShips
        }
        const grid = Grid.initGrid(col, row)
        placedShips.forEach((ship: Ship) => {
            grid.placeShipWithSurrounding(ship)
        })

        const types = [...shipsToPlace]
        const shipType = types.pop()
        const orientations = Math.random() > 0.5 ? [true, false] : [false, true]
        for (const isHorizontal of orientations) {
            const maxCol = isHorizontal ? grid.cols - shipType.getSize() : grid.cols
            const maxRow = isHorizontal ? grid.rows : grid.rows - shipType.getSize()
            const randomRowOffset = Math.floor(Math.random() * maxRow)
            for (var r = 0; r < maxRow; r++) {
                var rr = r + randomRowOffset
                if (rr >= maxRow) {
                    rr -= maxRow
                }
                const randomColOffset = Math.floor(Math.random() * maxCol)
                for (var c = 0; c < maxCol; c++) {
                    if (Grid.iter > row * col * 50) {
                        throw new Error(`In ${Grid.iter} iteration we weren't able to fit all ships`)
                    }

                    var cc = c + randomColOffset
                    if (cc >= maxCol) {
                        cc -= maxCol
                    }
                    const ship = new Ship(new Position(cc, rr), isHorizontal, shipType)

                    if (grid.canPlace(ship) === true) {
                        const pl = [...placedShips]
                        pl.push(ship)
                        const res = Grid.placeShips(col, row, pl, [...types])
                        if (res !== null) {
                            return res
                        }
                    }
                }
            }
        }

        return null
    }
}

export default Grid