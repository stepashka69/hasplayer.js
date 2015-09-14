var Graph = function() {
    this.container = null;
    this.legend = null;
    this.update = false;
    this.updateTimeInterval = 200; // in milliseconds
    this.updateWindow = 30000; // in milliseconds
    this.steps = this.updateWindow / this.updateTimeInterval;
    this.timer = null;
    this.elapsedTime = 0;
    this.lastTimeLabel = -1;
    this.firstTime = -1;
    this.lastDownloadedBitrate = null;
    this.lastPlayedBitrate = null;

    this.lineChartData = {
        labels: [],
        datasets: [{
            label: '&mdash; Downloaded Bitrate',
            fillColor: 'rgba(41, 128, 185, 0.2)',
            strokeColor: 'rgba(41, 128, 185, 1)',
            pointColor: 'rgba(41, 128, 185, 1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(220,220,220,1)',
            data: []
        }, {
            label: '&mdash; Played Bitrate',
            fillColor: 'rgba(231, 76, 60, 0.2)',
            strokeColor: 'rgba(231, 76, 60, 1)',
            pointColor: 'rgba(231, 76, 60, 1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(151,187,205,1)',
            data: []
        }]
    };
};

Graph.prototype.init = function(ctx, bitrates) {
    this.container = document.getElementById('bitrate-graph-container');
    this.container.className = 'module';
    var self = this;

    if (bitrates) {
        window.hasBitratesGraph = new Chart(ctx).LineConstant(self.lineChartData, {
            responsive: true,
            constantCurve: true,
            stepsCount: this.steps,
            animation: false,
            scaleBeginAtZero: false,
            // Boolean - If we want to override with a hard coded scale
            scaleOverride: true,
            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: bitrates.length - 1,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: bitrates[bitrates.length - 1] / (bitrates.length - 1),
            // Number - The scale starting value
            scaleStartValue: bitrates[0],
            pointDot : false,
            showTooltips: false,
            scaleShowVerticalLines : false,
            scaleLabels: bitrates,
            legendTemplate : '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="color:<%=datasets[i].strokeColor%>"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>'

        });

        if (this.legend === null) {
            this.legend = window.hasBitratesGraph.generateLegend();
            document.getElementById('chartLegend').innerHTML = this.legend;
        }

        highBitrateSpan.innerHTML = bitrates[bitrates.length - 1]/1000000;
        lowBitrateSpan.innerHTML = bitrates[0]/1000000;

        this.lastPlayedBitrate = null;

        this.update = true;

        // Init first graph value
        this.elapsedTime = 0;
        window.hasBitratesGraph.addData([this.lastDownloadedBitrate, this.lastPlayedBitrate], this.timeLabel(this.elapsedTime));
    }
};

Graph.prototype.setupEventListeners = function() {
    minivents.on('video-ended', this.stop);
};

Graph.prototype.timeLabel = function(_elapsedTime) {
    var label = '';

    _elapsedTime /= 1000;

    if (_elapsedTime >= this.lastTimeLabel + 1) {
        this.lastTimeLabel = Math.floor(_elapsedTime);
        label = this.lastTimeLabel;
    }

    return label;
};

Graph.prototype.handleGraphUpdate = function() {
    if (window.hasBitratesGraph !== undefined && this.update) {

        if (window.hasBitratesGraph.datasets[0].points.length > this.steps) {
            window.hasBitratesGraph.removeData();
        }

        this.elapsedTime += this.updateTimeInterval;
        window.hasBitratesGraph.addData([this.lastDownloadedBitrate, this.lastPlayedBitrate], this.timeLabel(this.elapsedTime));
        window.hasBitratesGraph.update();
    }
};

Graph.prototype.initTimer = function() {
    var self = this;
    if (this.timer === null) {
        this.timer = new LoopTimer(function() { self.handleGraphUpdate(); }, this.updateTimeInterval);
    } else {
        this.timer.stop();
    }
};

Graph.prototype.reset = function () {
    this.lastDownloadedBitrate = null;
    this.lastPlayedBitrate = null;
    this.lastTimeLabel = -1;
    this.firstTime = -1;
    this.elapsedTime = 0;

    if (window.hasBitratesGraph !== undefined) {
        window.hasBitratesGraph.destroy();
        this.lineChartData.labels = [];
        this.lineChartData.datasets[0].data = [];
        this.lineChartData.datasets[1].data = [];
        this.update = false;
    }
};
