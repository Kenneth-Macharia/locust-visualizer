# Locust Outbreak Visualizer App

- This web-based simulation app reviews locust outbreak data and visualises the
  overall farmland yield impact.
- It collects json data informing farmlands with locust outbreak sightings and outputs:

    1. An estimate percentage on farmland yields loss
    2. A visualization of the impacted farms within the farmland

## How to run the app

## Assumptions

- The data JSON payload always has the 3 data points `wind direction`, `grid size`
  and `outbreak co-ordinates`.
- Outbreaks on adjacent farms are treated as independent outbreaks i.e a neigbouring
  farm will be included in the yield loss estimate even if it is another outbreak site.
- Sites outside the provided grid (whether an outbreak site or neighbour) will be excluded
  from the yield loss estimate.
- An outbreak neighbour shared by another outbreak site will be included in both outbreak
  sites' estimates.
