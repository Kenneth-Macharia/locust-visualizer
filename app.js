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
      getData() {
        fetch(this.requestURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {

          this.windDirection = data.wind_direction
          this.farmSize = data.grid_width_and_length
          this.farmCoords.push(...data.confirmed_outbreaks)

          if (this.farmCoords.length !== 0) {

            // remove duplicate / overlapping co-ordinates
            this.farmCoords = Array.from(new Set(this.farmCoords.map(JSON.stringify))).map(
            JSON.parse);

            this.overallImpact = this.computeOverallImpact()
            this.showImpact = true

          } else {
            this.overallImpact = 0
            this.showImpact = true
          }
        })
        .catch((error) => {
            alert(error);
        });

        this.requestURL = '',
        this.windDirection = '',
        this.farmCoords = [],
        this.farmSize = 0
      },

      computeOverallImpact() {
        // Computes the overall outbreak impact on all outbreak frams within a farmland

        let farmsImpactSum = 0.0

        for (c of this.farmCoords) {
          // skip farms that are outside the specified grid
          if ((c.x < 0) || (c.x > this.farmSize - 1) || (c.y < 0) || (c.y > this.farmSize - 1)) {
            continue
          }

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

        let result = (farmsImpactSum/(this.farmSize*this.farmSize))*100
        return (Math.round((result + Number.EPSILON) * 100) / 100)
      },

      computeFarmImpact(coord, windDirection) {
        // Takes an individual outbreak farm's coordinates and the wind direction and computes the impact on the farm plus valid surrounding neighbouring farms

        let neighbrs = []
        let impact = 0.0

        // check if there is a valid nothern neighbour
        neighbrs.push((coord.y - 1) >= 0 ? 1 : 0)

        // check if there is a valid southern neighbour
        neighbrs.push((coord.y + 1) <= (this.farmSize - 1) ? 1 : 0)

        // check if there is a valid eastern neighbour
        neighbrs.push((coord.x + 1) <= (this.farmSize - 1) ? 1 : 0)

        // check if there is a valid western neighbour
        neighbrs.push((coord.x - 1) >= 0 ? 1 : 0)

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
    },
  })

  app.mount('#app')
