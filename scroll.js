import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import * as HR_scatt from './HR_scatt.js';
import * as EDA_scatt from './EDA_scatt.js';
import * as TEMP_scatt from './TEMP_scatt.js';
import * as ACC_scatt from './ACC_scatt.js';

// index of slide is [0, totalSlides-1]
let currentSlide = 0;
const totalSlides = 7;
let isScrolling = false;

//remove all things inside body
function removeAll() {
    d3.select('body').selectAll('*').remove();
}

//add head back when back to the first slide
function addHead() {
    d3.select('body').append('div').attr('id', 'head');
    d3.select('#head').append('h1').text('Score and Stress');
    d3.select('#head').append('h2').text('How is stress related to score? How does stress change during the test?');
}
//add div and tooltip back for scatter and line plots
function addDiv() {
    d3.select('body').append('div').attr('id', 'layout');
    d3.select('#layout').append('div').attr('id', 'chart');
    d3.select('#layout').append('div').attr('id', 'container');
    d3.select('#container').append('div').attr('class', 'tooltip').attr('style', 'opacity: 0;');
    d3.select('#container').append('div').attr('id', 'main');
    d3.select('#main').append('h4').attr('id', 'student-name');
    d3.select('#main').append('svg').attr('id', 'test').attr('height', '200px');
}

//show the slide
function showSlide(slideIndex) {
  // You update your chart here based on slideIndex
  console.log("Displaying slide", slideIndex);

  d3.select("#chart").selectAll("*").remove(); // Clear current chart

  // Example switch for different plots
  switch (slideIndex) {
    case 0:
        removeAll();
        addHead();
        break;
    case 1:
        removeAll();
        d3.select('body').append('div').attr('class', 'container');
        d3.select('.container').append('p').text('Stress plays a significant role in our academic performance—but to what extent does it actually affect exam outcomes? Some theories suggest that moderate stress can motivate students to focus and perform better, while others argue that excessive stress can impair concentration and lead to lower scores.');
        d3.select('.container').append('p').text('In this project, we examine the relationship between stress and exam performance by analyzing physiological signals from four dimensions: Heart Rate (HR), Electrodermal Activity (EDA), Temperature, and Accelerometer (ACC) data. By correlating these metrics with students’ test scores, we aim to find out how stress varies between individuals and how it might influence academic results.');
        break;
    case 2:
        removeAll();
        d3.select('body').append('h3').text('Heart Rate (HR)');
        d3.select('body').append('p').text('Heart rate in our data is measured in beats per minute (BPM). A typical resting heart rate ranges between 60 and 100 BPM, while values above 100 BPM may be an indication of stress. What do you think the relationship is between heart rate and academic performance? Try drawing a line in the scatter plot below to test your hypothesis—where the x-axis represents the average heart rate during the test, and the y-axis shows the weighted test score.');
        addDiv();
        d3.select('#chart').append('div').attr('id', 'chart2');
        HR_scatt.renderScatterPlot();
        break;
    case 3:
        removeAll();
        d3.select('body').append('h3').text('Electrodermal Activity (EDA)');
        d3.select('body').append('p').text('EDA (Electrodermal Activity) measures skin conductance, which varies in response to emotional or sympathetic arousal. Feelings of stress, anxiety, or perceived danger would cause values for EDA to increase. Just like what you did for the heart rate plot, try drawing a line below to explore how EDA levels might be correlated with academic performance.');
        addDiv();
        d3.select('#chart').append('div').attr('id', 'chart1');
        EDA_scatt.renderScatterPlot();
        break;
    case 4:
        removeAll();
        d3.select('body').append('h3').text('Temperature');
        d3.select('body').append('p').text('We also investigate the relationship between stress, through the measure of temperature (in degrees Celsius), and students’ exam performance.');
        d3.select('body').append('p').text('By hovering over the points in the scatter plot, we can observe how temperature changes throughout the tests. A common pattern is a rise in temperature at the beginning of the exam. and sometimes a decline towards the end. This might serve as evidence to support the fact that sympathetic responses, such as feelings of stress or anxiety, could lead to increase in temperature.');
        addDiv();
        d3.select('#chart').append('div').attr('id', 'chart3');
        TEMP_scatt.renderScatterPlot();
        break;
    case 5:
        removeAll();
        d3.select('body').append('h3').text('Acceleration (ACC)');
        d3.select('body').append('p').text('The accelerometer gives us acceleration data measured in x (left and right), y (forward and backward) and z (up and down) dimensions. We transform the data by taking the magnitude from three dimensions, with unit = 1/64g, which is 0.153 m/s².');
        addDiv();
        d3.select('#chart').append('div').attr('id', 'chart4');
        ACC_scatt.renderScatterPlot();
        break;
    case 6:
        removeAll();
        d3.select('body').append('p').text('conclusion');
        break;
  }
}

// set change of slide number
function onScroll(event) {
  if (isScrolling) return;
  isScrolling = true;

  if (event.deltaY > 0 && currentSlide < totalSlides - 1) {
    currentSlide++;
  } else if (event.deltaY < 0 && currentSlide > 0) {
    currentSlide--;
  }

  showSlide(currentSlide);

  // prevent triggering multiple times rapidly by 500ms debounce
  setTimeout(() => {
    isScrolling = false;
  }, 1500);
}

window.addEventListener("wheel", onScroll);