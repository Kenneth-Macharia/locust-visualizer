const app = Vue.createApp({
    data() {
      return {
        requestURL: '',
        windDirection: '',
        farmCoords: [],
        farmSize: 0,
        overallImpact: 0.0
      }
    },

    methods: {
      getData() {
        fetch(this.requestURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(dat => {
            this.requestURL = ''

            data = {
              "grid_width_and_length": 6,
              "wind_direction": "SOUTH",
              "confirmed_outbreaks": [{
                  "x": 1,
                  "y": 1
                },
                {
                  "x": 4,
                  "y": 3
                }
              ]
            }

            this.windDirection = data.wind_direction
            this.farmSize = data.grid_width_and_length
            this.farmCoords.push(...data.confirmed_outbreaks)

            this.computeOverallImpact()
        })
        .catch((error) => {
            alert(error);
        });
      },

      computeOverallImpact() {
        // Computes the overall outbreak impact on all outbreak frams within a farmland

        let farmsImpactSum = 0.0

        for (c of this.farmCoords) {
            if (this.windDirection === 'NORTH') {
              farmsImpactSum += this.computeFarmImpact(c, 0)

            } else if (this.windDirection === 'SOUTH') {
              farmsImpactSum += this.computeFarmImpact(c, 1)

            } else if (this.windDirection === 'EAST') {
              farmsImpactSum += this.computeFarmImpact(c, 2)

            } else {
              farmsImpactSum += this.computeFarmImpact(c, 3)
            }
        }

        result = (farmsImpactSum/(this.farmSize*this.farmSize))*100
        this.overallImpact = Math.round((result + Number.EPSILON) * 100) / 100
      },

      computeFarmImpact(farmCoord, windDirection) {
        // Takes an individual outbreak farm's coordinates and the wind direction and computes the impact on the farm plus valid surrounding neighbouring farms

        let neighbrs = []
        let impact = 0.0

        // check if there is a valid nothern neighbour
        neighbrs.push((farmCoord.y - 1) >= 0 ? 1 : 0)

        // check if there is a valid southern neighbour
        neighbrs.push((farmCoord.y + 1) <= (this.farmSize - 1) ? 1 : 0)

        // check if there is a valid eastern neighbour
        neighbrs.push((farmCoord.x + 1) <= (this.farmSize - 1) ? 1 : 0)

        // check if there is a valid western neighbour
        neighbrs.push((farmCoord.x - 1) >= 0 ? 1 : 0)

        // compute individual farm impact
        impact = 0.8 + (neighbrs[windDirection] === 1 ? 0.5 : 0)
        neighbrs.splice(windDirection, 1)  // remove the down-wind farm
        for (f of neighbrs) {
          if (f === 1) {
            impact += 0.25
          }
        }

        return impact
      },
    },

    computed: {
      yieldLoss() {
        return `Overall impact is ${this.overallImpact}% yield loss.`
      },

      showImpact() {
        return this.overallImpact !== 0
      }
    },
  })

  app.mount('#app')
