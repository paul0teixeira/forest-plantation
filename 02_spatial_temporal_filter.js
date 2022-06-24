/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-43.55611927267485, -2.771066486650524],
          [-43.55611927267485, -13.371738608730073],
          [-37.22799427267485, -13.371738608730073],
          [-37.22799427267485, -2.771066486650524]]], null, false),
    geometry2 = 
    /* color: #98ff00 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-63.08201587031393, 6.684091946841344],
          [-63.08201587031393, -34.218292328021256],
          [-34.07810962031394, -34.218292328021256],
          [-34.07810962031394, 6.684091946841344]]], null, false),
    geometry3 = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.MultiPolygon(
        [[[[-52.7390801104974, -21.536956867871922],
           [-52.55643240541927, -21.603366936289724],
           [-52.4973808917474, -21.595705789584756],
           [-52.33670584291927, -21.602090106671348],
           [-52.30237356752865, -21.538234271426713],
           [-52.1018730792474, -21.483295775713092],
           [-51.99063650698177, -21.3119592603365],
           [-52.10324637026302, -21.259495358561345],
           [-52.15543142885677, -21.223655605610617],
           [-52.2062431964349, -21.16987965176229],
           [-52.30924002260677, -21.151949986595113],
           [-52.5248467120599, -21.268453934724704]]],
         [[[-52.70213794488135, -33.0898032404479],
           [-52.610127446834476, -33.13006379309178],
           [-52.46043872613135, -32.836315056473396],
           [-52.5455827691001, -32.80861783840017]]],
         [[[-50.876412959084774, -9.075822519858546],
           [-50.299630732522274, -9.064973571525744],
           [-50.239205927834774, -8.511250992179413],
           [-50.848947138772274, -8.462353874235337]]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/**
 * @name
 *      FOREST PLANTATION SPATIAL-TEMPORAL FILTERS C7 
 * 
 * @description
 *      Filter for Mapbiomas Collection 7 Forest Plantation class.
 * 
 * @author
 *      Agrosatélite
 *      mapbiomas@agrosatelite.com.br
 *
 * @version
 *  MapBiomas Collection 7.0
 * 
 */
 
 
var filters = require('users/agrosatelite_mapbiomas/mapbiomas_tutorial:collection6/utils/temporal_spatial_filters.js');

var temporal = filters.temporal; 
var spatial = filters.spatial;


// set the input path to the raw classification result:
var input = 'users/your_username/MAPBIOMAS/C7/FOREST_PLANTATION/RESULTS/RAW';

// set the path for the filtered result:
var output = 'users/your_username/MAPBIOMAS/C7/FOREST_PLANTATION/RESULTS/TEMPORAL_SPATIAL_FILTERED';

var collection = ee.ImageCollection(input)



// define masks
var brasil = ee.Image('projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO5/country-raster')
var ESTADOS = ee.FeatureCollection('users/agrosatelite_mapbiomas/REGIONS/ibge_estados_2019')


var regions = ESTADOS.filter(ee.Filter.or(
                ee.Filter.equals('SIGLA_UF', 'PA'),
                ee.Filter.equals('SIGLA_UF', 'TO'),
                ee.Filter.equals('SIGLA_UF', 'AP'),
                ee.Filter.equals('SIGLA_UF', 'MA'),
                ee.Filter.equals('SIGLA_UF', 'CE'),
                ee.Filter.equals('SIGLA_UF', 'MT'),
                ee.Filter.equals('SIGLA_UF', 'RS')
                ))
                .merge(geometry)
                
var mask = ee.Image(1).clip(regions)



// get regions to filter
var collection_w5t2 = collection.map(function(image) {
  return image.updateMask(mask).updateMask(brasil)
})

var collection_w5t3 = collection.map(function(image) {
  return image.updateMask(brasil)
})




// filter a

var filtersToApply = [
  spatial.build(spatial.minConnnectedPixels(6)),
  
  temporal.build(temporal.getMovingWindow(1986, 1986, 3), temporal.thresholdFilter(2)), // 3 years window, 1986 only
  temporal.build(temporal.getMovingWindow(1987, 2020, 5), temporal.thresholdFilter(2)), // 7 years window, 1988 to 2017


  spatial.build(spatial.minConnnectedPixels(6)),
]

var filteredCollection__w5t2 = filters.applyFilters(filtersToApply, collection_w5t2);


// filter b

var filtersToApply = [
  spatial.build(spatial.minConnnectedPixels(6)),
  
  temporal.build(temporal.getMovingWindow(1986, 1995, 3), temporal.thresholdFilter(2)), 
  temporal.build(temporal.getMovingWindow(1995, 2017, 5), temporal.thresholdFilter(3)), 
  temporal.build(temporal.getMovingWindow(2019, 2021, 3), temporal.thresholdFilter(1)), 


  spatial.build(spatial.minConnnectedPixels(6)),
]

var filteredCollection__w5t3 = filters.applyFilters(filtersToApply, collection_w5t3);

var filteredCollection = filteredCollection__w5t2.merge(filteredCollection__w5t3).map(function(img){return img.cast({'classification':'byte'})})

// print (filteredCollection)
// Map.addLayer(filteredCollection)


var filteredCollection = ee.ImageCollection(
  ee.List.sequence(1985, 2021).map(function(ano){
  var result = filteredCollection.filter(ee.Filter.eq(ee.String('year'), ee.Number(ano))).max()
  var merged = result.rename(ee.String('classification')).set(ee.String('year'), ee.Number(ano))
  return merged.cast({'classification':'byte'})
  })
)



// copy 1986 to 1985
var firstYear = filteredCollection.filterMetadata('year', 'equals', 1986).first();
filteredCollection = filteredCollection
  .filter(ee.Filter.inList('year', [1985]).not())
  .merge(ee.ImageCollection([
    firstYear.set('year', 1985)
  ]))
  .sort('year')
  
  
// set years greather than 2015 as forest plantation 
var setToForestPlantation_1 = filteredCollection.filter(ee.Filter.inList('year', [2013, 2014, 2015])).and()

var last5Year = filteredCollection
  .filterMetadata('year', 'greater_than', 2015)
  .map(function(image) {
    return image.or(setToForestPlantation_1).set('year', image.getNumber('year'))
  })

var filteredCollection = filteredCollection
  .filterMetadata('year', 'not_greater_than', 2015)
  .merge(last5Year).sort('year')


// filled

var filteredCollection = filteredCollection
  .merge(ee.ImageCollection([
    ee.Image(0).rename('classification').set('year', 1984),
    ee.Image(0).rename('classification').set('year', 2022)
  ]))
  .sort('year')

var filled = ee.List.sequence(1985, 2021).map(function(year) {
  var before = filteredCollection.filterMetadata('year', 'less_than', year).sum()
  var thisYear = filteredCollection.filterMetadata('year', 'equals', year).first().unmask()
  var after = filteredCollection.filterMetadata('year', 'greater_than', year).sum()
  
  return thisYear.or(before.and(after)).set('year', year)
})

filled = ee.ImageCollection(filled)

// print (filled)

// to bands
var filtered = filters.toBandsByYear(filled).updateMask(brasil)


// print (filtered)

var year = 2010

Map.addLayer(filtered.selfMask(), { bands: 'b' + year, palette: ['BLUE']}, 'Filtered')


Export.image.toAsset({
  image: filtered.unmask().byte(), 
  description: 'FOREST_PLANTATION_TEMPORAL_SPATIAL_FILTER', 
  assetId: output,
  region: brasil.geometry(), 
  scale: 30, 
  maxPixels: 10e10
})