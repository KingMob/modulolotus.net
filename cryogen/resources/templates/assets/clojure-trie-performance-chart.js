var data = {
    labels: ['Standard data structures', 'Standard w/ word counts', 'Standard w/ transients', 'Array-maps', 'Transduce', 'Record', 'Record w/ word count', 'Volatile-mutable', 'Unsychronized-mutable'], 
    series: [[34.53, 2.70, 2.14, 34.90, 24.44, 66.0, 1.03, 0.517, 0.432]]
};

var options = {
    chartPadding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    axisY: {
        onlyInteger: true
    },
    plugins: [
        Chartist.plugins.ctAxisTitle({
            axisY: {
                axisTitle: 'Duration (s)',
                axisClass: 'ct-axis-title',
                offset: {
                    x: 0,
                    y: 15
                },
                flipTitle: true
            }
        })
    ]
}

new Chartist.Bar('.ct-chart', data, options);
