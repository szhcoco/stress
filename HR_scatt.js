import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import * as HR from './HR.js';
import { getHRScales } from './shared_hr_scatt.js';


// load data
async function loadData() {
    const studentCount = 10;
    const tests = ['Midterm 1', 'Midterm 2', 'Final'];
    const HR_grades = [];

    const grades = await d3.csv('grades.csv', d => ({
        students: d.students,
        midterm_1: +d.Midterm_1,
        midterm_2: +d.Midterm_2,
        final: +d.Final / 2,

    }));

    for (let student = 1; student <= studentCount; student++) {
        const s = student < 10 ? `S0${student}` : `S${student}`;
        const s_grade = grades.find(g => g.students === s);

        // const avg_score = (s_grade.midterm_1 + s_grade.midterm_2 + s_grade.final / 2) / 3;
        // let allTestHR = [];

        for (const test of tests) {
            const path = `dataset/S${student}_processed/${test}/HR.csv`;

            const data = await d3.csv(path, d => ({
                HR: +d.HR,
                period: d.period.trim()
            }));

            const inTestHR = data.filter(d => d.period === 'in-test').map(d => d.HR);

            // allTestHR.push(...inTestHR);
            const avg_HR = inTestHR.reduce((sum, v) => sum + v, 0) / inTestHR.length;

            let score;
            if (test === 'Midterm 1') score = s_grade.midterm_1;
            else if (test === 'Midterm 2') score = s_grade.midterm_2;
            else if (test === 'Final') score = s_grade.final;

            HR_grades.push({
                student,
                test,
                avg_HR: avg_HR,
                score: score,
    
    
            });

        }


    }

    return HR_grades;
}

// function to compute the best-fit line
function linearRegression(data) {
    const n = data.length;
    const sumX = d3.sum(data, d => d.avg_HR);
    const sumY = d3.sum(data, d => d.score);
    const sumXY = d3.sum(data, d => d.avg_HR * d.score);
    const sumX2 = d3.sum(data, d => d.avg_HR * d.avg_HR);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

export async function renderScatterPlot() {
    const data = await loadData();

    const width = 1100;
    const height = 600;
    const margin = { top: 20, right: 10, bottom: 50, left: 40 };

    const svg = d3
        .select('#chart2')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width) 
        .attr('height', height);
        
    // add a message to show the accuracy of line user drawn
    d3.select('#chart2')
        .append('p')
        .attr('id', 'feedback-message')
        .style('font-size', '20px')
        .style('margin-top', '10px')
        .style('color', '#333')
        .style('font-weight', 'bold');

    const {xScale, yScale, usableArea} = await getHRScales(Promise.resolve(data), width, height, margin);
    

    // xScale = d3
    //     .scaleLinear()
    //     .domain(d3.extent(data, (d) => +d.avg_HR))
    //     .range([0, width])
    //     .nice();

    // yScale = d3.scaleLinear().domain(d3.extent(data, (d) => +d.score)).range([height, 0])

    // xScale.range([usableArea.left, usableArea.right]);
    // yScale.range([usableArea.bottom, usableArea.top]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // add legend for the dots
    const students = Array.from(new Set(data.map(d => d.student)));

    const color = d3.scaleOrdinal().domain(students).range(d3.schemePaired);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(data, (d) => d.student)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.avg_HR))
        .attr('cy', (d) => yScale(d.score))
        .attr('r', 16)
        .style('opacity', 0)
        .style('fill', d => color(d.student))
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5)
        .attr('class', d => `dot student-${d.student}`)
        .on('mouseover', (event, d) => {
            let svg = d3.select('#test');
            // let svg2 = d3.select('#mid2');
            // let svg3 = d3.select('#final');
            svg.selectAll('*').remove()

            d3.select('#student-name').text('Student '+d.student + ' - ' + d.test + ": Score " + d.score);
            // d3.select('label#midterm1').text('Midterm 1 Score: '+d.midterm_1+' Rank: '+d.m1_rank);
            // d3.select('label#midterm2').text('Midterm 2 Score: '+d.midterm_2+' Rank: '+d.m2_rank);
            // d3.select('label#finalexam').text('Final Score: '+d.final+' Rank: '+d.final_rank);

            HR.createPlot(svg, 'S'+d.student, d.test);
            // HR.createPlot(svg2, 'S'+d.student, 'Midterm 2');
            // HR.createPlot(svg3, 'S'+d.student, 'Final');
        });

    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // render xaxis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis')
        .call(xAxis)
        .append("text")
        .attr('x', (usableArea.left + usableArea.right) / 2)
        .attr('y', 50)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .text('Average HR');
    
    // render yaxis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis')
        .call(yAxis)
        .append('text')
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -(usableArea.top + usableArea.bottom) / 2)
        .attr("y", -30)
        .attr("fill", "black")
        .attr('font-size', '20px')
        .text("Weighted Average Grade");


    // allow users to draw their line:
    svg.append('rect')
        .attr('class', 'draw-overlay')
        .attr('x', usableArea.left)
        .attr('y', usableArea.top)
        .attr('width', usableArea.right - usableArea.left)
        .attr('height', usableArea.bottom - usableArea.top)
        .style('fill', 'transparent')
        .style('cursor', 'pointer');

    // Line to display user's drawing
    const userLine = svg.append('line')
        .attr('class', 'user-line')
        .attr('stroke', 'blue')
        .attr('stroke-width', 3)
        .attr('visibility', 'hidden');

    let isDrawing = false;
    let hasDrawn = false;
    let startPoint = null;

    svg.select('.draw-overlay')
        .style('pointer-events', 'all')
        .style('fill', 'transparent')
        .on('mousedown', (event) => {
            if (hasDrawn) return; 
            isDrawing = true;
            const [mx, my] = d3.pointer(event);
            startPoint = [mx, my];
            userLine
                .attr('x1', mx)
                .attr('y1', my)
                .attr('x2', mx)
                .attr('y2', my)
                .attr('visibility', 'visible');
        })
        .on('mousemove', (event) => {
            if (!isDrawing) return;
            const [mx, my] = d3.pointer(event, svg.node());
            userLine.attr('x2', mx).attr('y2', my);
        })
        .on('mouseup', (event) => {
            if (!isDrawing) return;
            isDrawing = false;

            const userCoords = {
                x1: +userLine.attr('x1'),
                y1: +userLine.attr('y1'),
                x2: +userLine.attr('x2'),
                y2: +userLine.attr('y2'),
            };

            showBestFitLine(userCoords);

            // Disable drawing overlay after first use
            svg.select('.draw-overlay')
                .style('cursor', 'default')
                .on('mousedown', null)
                .on('mousemove', null)
                .on('mouseup', null);

                // overlay.remove();

            // Ensure dots group is above overlay for interactivity
            svg.select('.dots').raise();
            d3.select('#chart').append('p').text('Based on the dataset we have, we do find a positive correlation between heart rate and academic performance. Students with higher average heart rate during the test tend to have higher scores for the exam. ');
        });



    // render legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    // give each student a legend
    // also enable clickable interaction:
    // when a student is selected, enlargen the three dots; and restore if click again
    const legendItem = legend.selectAll('.legend-item')
        .data(students)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 50})`)
        .style('cursor', 'pointer')
        .on('click', function(event, student) {
            const legend = d3.selectAll('.legend-item');
            const dots = d3.selectAll('.dot');
    
            const clickedLegend = d3.select(this);
            const isSelected = clickedLegend.classed('selected');
    
            if (isSelected) {
                clickedLegend.classed('selected', false);
                dots.filter(d => d.student === student)
                    .attr('r', 16);
            } else {
                legend.classed('selected', false);
                dots.attr('r', 16);
    
                clickedLegend.classed('selected', true);
                dots.filter(d => d.student === student)
                    .attr('r', 25);
            }
        });

    legendItem.append('rect')
        .attr('x', 0)
        .attr('y', -10)
        .attr('width', 28)
        .attr('height', 28)
        .attr('fill', d => color(d));

    legendItem.append('text')
        .attr('x', 45)
        .attr('y', 0)
        .attr('dy', '0.5em')
        .attr('font-size', '20px')
        .text(d => `Student ${d}`);
    
    // draw best fit line
    const { slope, intercept } = linearRegression(data);
    const xMin = d3.min(data, d => d.avg_HR);
    const xMax = d3.max(data, d => d.avg_HR);
    const bestFitLinePoints = [
        { x: xMin, y: slope * xMin + intercept },
        { x: xMax, y: slope * xMax + intercept }
    ];

    // the best fit line is initially hidden
    const bestFitLine = svg.append('line')
        .attr('class', 'best-fit-line')
        .attr('stroke', 'red')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '6,3')
        .attr('visibility', 'hidden');
    
    function showBestFitLine(userCoords) {

        const ux1 = xScale.invert(userCoords.x1);
        const uy1 = yScale.invert(userCoords.y1);
        const ux2 = xScale.invert(userCoords.x2);
        const uy2 = yScale.invert(userCoords.y2);

        const userSlope = (uy2 - uy1) / (ux2 - ux1);
        const userIntercept = uy1 - userSlope * ux1;

        const [xMin, xMax] = d3.extent(data, d => d.avg_HR);
        const userLinePoints = [
            { x: xMin, y: userSlope * xMin + userIntercept },
            { x: xMax, y: userSlope * xMax + userIntercept }
        ];

        bestFitLine
            .attr('visibility', 'visible')
            .attr('x1', xScale(userLinePoints[0].x))
            .attr('y1', yScale(userLinePoints[0].y))
            .attr('x2', xScale(userLinePoints[1].x))
            .attr('y2', yScale(userLinePoints[1].y))
            .transition()
            .duration(2000)
            .attr('x1', xScale(bestFitLinePoints[0].x))
            .attr('y1', yScale(bestFitLinePoints[0].y))
            .attr('x2', xScale(bestFitLinePoints[1].x))
            .attr('y2', yScale(bestFitLinePoints[1].y));
    
        svg.selectAll('.dots circle')
            .transition()
            .delay(1000)
            .duration(1000)
            .style('opacity', 0.8);
        
        hasDrawn = true;

        const mse = d3.mean(data, d => {
            const yUser = userSlope * d.avg_HR + userIntercept;
            const yTrue = slope * d.avg_HR + intercept;
            return (yUser - yTrue) ** 2;
        });

        //normalize the error
        const maxPossibleError = d3.variance(data.map(d => d.score));
        const accuracy = 100 * (1 - mse / maxPossibleError);

        // restrict the accuracy to be always within [0, 100]
        const clampedAccuracy = Math.max(0, Math.min(accuracy, 100));

        // show message abased on the accuracy
        const messageBox = d3.select('#feedback-message');
        if (clampedAccuracy >= 70) {
            messageBox.text(`🎉 Great job! Your hypothesis matches the output. Accuracy: ${clampedAccuracy.toFixed(1)}%`);
        } else {
            messageBox.text(`📉 Nice try, but the actual output is a bit different. Accuracy: ${clampedAccuracy.toFixed(1)}%`);
        }

    }
}


// const data = loadData();
// // console.log(data);

// renderScatterPlot();