const app = Vue.createApp({
    data() {
      return {
        requestURL: '',
        windDirection: '',
        farmCoords: [],
        farmSize: 0,
        overallImpact: 0.0,
        showImpact: false,
      }
    },

    methods: {
      reset() {
        // reset globals when input gets focus
        this.requestURL = '',
        this.windDirection = '',
        this.farmCoords = [],
        this.farmSize = 0,
        this.overallImpact = 0.0,
        this.showImpact = false,
        this.yieldLoss = ''

        // delete the currently rendered grid
        let table = this.grid.querySelector("tbody")
        rows = table.rows.length
        for (var i = (rows - 1); i >= 0; i--) {
          table.deleteRow(i);
        }
      },

      getData() {
        if (this.requestURL.length === 0) {
          alert("URL can't be blank")
          return
        }

        fetch(this.requestURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {

          // populate globals
          this.windDirection = data.wind_direction
          this.farmSize = data.grid_width_and_length
          this.farmCoords.push(...data.confirmed_outbreaks)

          if (this.farmCoords.length !== 0) {
            let initLen = this.farmCoords.length

            // remove duplicate / overlapping co-ordinates
            this.farmCoords = Array.from(new Set(this.farmCoords.map(JSON.stringify))).map(
            JSON.parse);

            if (initLen > this.farmCoords.length) {
              alert('The data has overlapping outbreak coordinates which will be excluded in the yield loss computation')
            }

            // compute yield loss and render impact map
            this.overallImpact = this.computeOverallImpact()
            this.renderImpactMap()

          } else {
            this.overallImpact = 0
            this.renderImpactMap()
          }
        })
        .catch(() => {
            alert('Data fetch failed, please confirm the URL provided');
        });
      },

      computeOverallImpact() {
        // Computes the overall outbreak impact on all outbreak frams within a farmland

        let farmsImpactSum = 0.0

        for (c of this.farmCoords) {

          // exclude farms outside the specified grid
          if ((c.x < 0) || (c.x > this.farmSize - 1) || (c.y < 0) || (c.y > this.farmSize - 1)) {

            alert(`{x:${c.x}, y:${c.y}} is outside the specified grid and will be excluded in the yield loss computation`)
            continue
          }

          let res = []

          if (this.windDirection === 'NORTH') {
            res = this.computeFarmImpact(c, 0)
            farmsImpactSum += res[0]
            c['n'] = res[1]

          } else if (this.windDirection === 'SOUTH') {
            res = this.computeFarmImpact(c, 1)
            farmsImpactSum += res[0]
            c['n'] = res[1]

          } else if (this.windDirection === 'EAST') {
            res = this.computeFarmImpact(c, 2)
            farmsImpactSum += res[0]
            c['n'] = res[1]

          } else {
            res = this.computeFarmImpact(c, 3)
            farmsImpactSum += res[0]
            c['n'] = res[1]
          }
        }

        let result = (farmsImpactSum/(this.farmSize*this.farmSize))*100

        // round result to 2 decimal places
        return (Math.round((result + Number.EPSILON) * 100) / 100)
      },

      computeFarmImpact(coord, windDir) {
        // Takes an individual outbreak farm's coordinates and the wind direction and computes the impact on the farm plus valid surrounding neighbouring farms

        // represent neigbours on either wind direction in the form [1, 0, 2, 1] where 1 is a valid neighbour away from the wind, 2 is a valid neigbour downwind and 0 no neigbour.

        // index 0 element in the above array is always the north neighbour, 1 is the southern, 2 the eastern and 3 the western.
        let neighbrs = []
        let impact = 0.0
        let downWind = 0

        // check if there is a valid nothern neighbour
        neighbrs.push((coord.y - 1) >= 0 ? 1 : 0)

        // check if there is a valid southern neighbour
        neighbrs.push((coord.y + 1) <= (this.farmSize - 1) ? 1 : 0)

        // check if there is a valid eastern neighbour
        neighbrs.push((coord.x + 1) <= (this.farmSize - 1) ? 1 : 0)

        // check if there is a valid western neighbour
        neighbrs.push((coord.x - 1) >= 0 ? 1 : 0)

        // compute individual farm impact
        impact = 0.8 + (neighbrs[windDir] === 1 ? 0.5 : 0)

        // remove down-wind to collectively compute the other neighbours
        downWind = neighbrs.splice(windDir, 1)

        for (f of neighbrs) {
          if (f === 1) {
            impact += 0.25
          }
        }

        // add a back down-wind neibour marker if valid down-wind neighbour exists
        neighbrs.splice(windDir, 0, downWind[0] === 1 ? 2 : 0)
        return [impact, neighbrs]
      },

      renderImpactMap() {
        let t = this.grid  //table element
        let s = this.farmSize - 1
        let c = this.farmCoords
        let outBreakCells = []

        for (y = 0; y <= s; y++) {
          let row = t.insertRow(y)

          for (x = 0; x<= s; x++) {
            let cell = row.insertCell(x)

            // for each cell created check if it an outbreak cell
            let cellCheck = c.filter((v) => {
              return ((v.x === x && v.y === y));
            })

            // if current cell is an outbreak cell, save it and label it on the grid
            if (cellCheck.length > 0) {
              outBreakCells.push(cellCheck[0])
              cell.innerHTML = "80% Loss"
              cell.setAttribute("class", "outbreak");
            }
          }
        }

        // process neighbours of the saved outbreak cells
        for (oCell of outBreakCells) {
          for (i = 0; i <= (oCell.n.length - 1); i++) {

            let x = oCell.x
            let y = oCell.y
            let neighGrid = oCell.n
            let ncell = null

            if (i === 0) {
                // compute location and label valid northern neighbour
              if (neighGrid[i] === 1) {
                // 25% impact neighbrs
                ncell = t.rows[y-1].cells[x]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "25% Loss"
                  ncell.setAttribute("class", "outbreak-2")
                }

              } else if (neighGrid[i] === 2) {
                // 50% neighbr
                ncell = t.rows[y-1].cells[x]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "50% Loss"
                  ncell.setAttribute("class", "outbreak-1")
                }
              }

            } else if (i === 1) {
              // compute location and label southern neighbour
              if (neighGrid[i] === 1) {
                // 25% impact neighbr
                ncell = t.rows[y+1].cells[x]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "25% Loss"
                  ncell.setAttribute("class", "outbreak-2")
                }

              } else if (neighGrid[i] === 2) {
                // 50% neighbr
                ncell = t.rows[y+1].cells[x]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "50% Loss"
                  ncell.setAttribute("class", "outbreak-1")
                }
              }

            } else if (i === 2) {
              // compute location and label eastern neighbour
              if (neighGrid[i] === 1) {
                // 25% impact neighbr
                ncell = t.rows[y].cells[x+1]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "25% Loss"
                  ncell.setAttribute("class", "outbreak-2")
                }

              } else if (neighGrid[i] === 2) {
                // 50% neighbr
                ncell = t.rows[y].cells[x+1]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "50% Loss"
                  ncell.setAttribute("class", "outbreak-1")
                }
              }

            } else {
              // compute location and label western neighbour
              if (neighGrid[i] === 1) {
                // 25% impact neighbr
                ncell = t.rows[y].cells[x-1]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "25% Loss"
                  ncell.setAttribute("class", "outbreak-2")
                }

              } else if (neighGrid[i] === 2) {
                // 50% neighbr
                ncell = t.rows[y].cells[x-1]
                if (ncell.getAttribute("class") !== "outbreak") {
                  ncell.innerHTML = "50% Loss"
                  ncell.setAttribute("class", "outbreak-1")
                }
              }
            }
          }
        }
        this.showImpact = true
      },
    },

    computed: {
      yieldLoss() {
        return `Overall impact is ${this.overallImpact}% yield loss`
      },

      grid() {
        return document.querySelector('#grid-table')
      },
    },
  })

  app.mount('#app')
