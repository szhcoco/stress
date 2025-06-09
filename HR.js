import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


export function createPlot(svg, student, exam) {
    svg.selectAll("*").remove();
    let margin = { top: 20, right: 60, bottom: 50, left: 60 };
    let boundingRect = svg.node().getBoundingClientRect();
    let width = boundingRect.width - margin.left - margin.right;
    let height = 200 - margin.top - margin.bottom;

    let g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    // let xScale = d3.scaleLinear().range([0, width]);
    // let yScale = d3.scaleLinear().range([height, 0]);

    let xAxisGroup = g.append("g").attr("transform", `translate(0,${height})`);
    let yAxisGroup = g.append("g");

    draw(student, exam, xAxisGroup, yAxisGroup, g, width, height, margin);
}

// const tooltip = d3.select(".tooltip");


function setupTooltip(selection, field) {
    const tooltip = d3.select("#container .tooltip");
    selection
        .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`${field}: ${d[field]}<br/>Time: ${d.time_seconds}s<br/>Timestamp: ${d.timestamp}<br/>Period: ${d.period}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
        });
}


function draw(student, exam, xAxisGroup, yAxisGroup, g, width, height, margin) {
    g.selectAll(".line-path, .line-dot, .vline, .label, .area").remove();

    Promise.all([
        d3.csv(`HR_min_max_${exam}.csv`, d3.autoType),
        d3.csv(`dataset/${student}_processed/${exam}/HR.csv`, d3.autoType)
    ])
    .then(([areaData, personData]) => {
        const N = 200;
        const downsampledArea = areaData.filter((_, i) => i % N === 0);
        const downsampledPerson = personData.filter((_, i) => i % N === 0);

        // Unified scales
        const x = d3.scaleLinear()
            .domain(d3.extent(personData, d => d.time_seconds))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max([...areaData.map(d => d.HR_max), ...personData.map(d => d.HR)])])
            .nice()
            .range([height, 0]);

        // Axes
        xAxisGroup.call(d3.axisBottom(x));
        yAxisGroup.call(d3.axisLeft(y).ticks(8));

        // Area
        const area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.time_seconds))
            .y0(d => y(d.HR_min))
            .y1(d => y(d.HR_max));

        g.append("path")
            .datum(downsampledArea)
            .attr("class", "area")
            .attr("d", area)
            .attr("fill", "grey")
            .attr("opacity", 0.4);

        // Red HR line
        const line = d3.line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.time_seconds))
            .y(d => y(d.HR));

        g.append("path")
            .datum(downsampledPerson)
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", "crimson")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Tooltip dots (same scale and same downsampled data)
        setupTooltip(
            g.selectAll(".line-dot")
                .data(downsampledPerson)
                .enter().append("circle")
                .attr("class", "line-dot")
                .attr("cx", d => x(d.time_seconds))
                .attr("cy", d => y(d.HR))
                .attr("r", 5)
                .attr("fill", "transparent")
                .attr("stroke", "transparent")
                .style("pointer-events", "all"), // enable hover
            "HR"
        );

        // Axis labels
        g.selectAll(".x-axis-label, .y-axis-label").remove();

        g.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("font-size", "12px")
            .text("Time (seconds)");

        g.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-margin.left + 20},${height / 2}) rotate(-90)`)
            .style("font-size", "12px")
            .text("HR");
    });
}
