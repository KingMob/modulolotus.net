var data = {
    labels: ['Standard hash-maps', 'Transduce', 'Standard w/ word counts', 'Standard w/ WCs and transients', 'Record', 'Record w/ word count', 'Volatile-mutable', 'Unsychronized-mutable'], 
    series: [[34.53, 24.44, 2.70, 2.14, 66.0, 1.03, 0.517, 0.432]]
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
