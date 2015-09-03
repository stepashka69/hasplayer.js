var helpers = Chart.helpers;

Chart.types.Line.extend({
    // Passing in a name registers this chart in the Chart namespace in the same way
    name: "LineConstant",
    initialize: function(data){
        Chart.types.Line.prototype.initialize.apply(this, arguments);
        var self = this;
        this.scale.calculateX = function(index){
            var isRotated = (this.xLabelRotation > 0),
                // innerWidth = (this.offsetGridLines) ? this.width - offsetLeft - this.padding : this.width - (offsetLeft + halfLabelWidth * 2) - this.padding,
                innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
                valueWidth = (self.options.stepsCount) ? innerWidth/self.options.stepsCount : innerWidth/Math.max((this.valuesCount - ((this.offsetGridLines) ? 0 : 1)), 1),
                valueOffset = (valueWidth * index) + this.xScalePaddingLeft;

            if (this.offsetGridLines){
                valueOffset += (valueWidth/2);
            }

            return Math.round(valueOffset);
        };

        this.scale.calculateY = function(value){
            if (self.options.scaleLabels) {
                var yLabelGap = (this.endPoint - this.startPoint) / this.steps;
                var yLabelCenter = this.endPoint - (yLabelGap * self.options.scaleLabels.indexOf(value));
                return yLabelCenter;
            } else {
                var scalingFactor = this.drawingArea() / (this.min - this.max);
                return this.endPoint - (scalingFactor * (value - this.min));
            }
        };

        this.scale.buildYLabels = function(){
            this.yLabels = [];

            if (self.options.scaleLabels) {
                 for (var i=0, len = self.options.scaleLabels.length; i < len; i++){
                    this.yLabels.push(helpers.template(this.templateString,{value: self.options.scaleLabels[i]}));
                }
            } else {
                for (var i=0; i<=this.steps; i++){
                    this.yLabels.push(helpers.template(this.templateString,{value:(this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces)}));
                }
            }

            this.yLabelWidth = (this.display && this.showLabels) ? helpers.longestText(this.ctx,this.font,this.yLabels) : 0;
        };
    },
    draw: function(ease) {
            var easingDecimal = ease || 1;
            this.clear();

            var ctx = this.chart.ctx;

            // Some helper methods for getting the next/prev points
            var hasValue = function(item){
                return item.value !== null;
            },
            nextPoint = function(point, collection, index){
                return helpers.findNextWhere(collection, hasValue, index) || point;
            },
            previousPoint = function(point, collection, index){
                return helpers.findPreviousWhere(collection, hasValue, index) || point;
            };

            this.scale.draw(easingDecimal);

            helpers.each(this.datasets,function(dataset){
                var pointsWithValues = helpers.where(dataset.points, hasValue);

                //Transition each point first so that the line and point drawing isn't out of sync
                //We can use this extra loop to calculate the control points of this dataset also in this loop

                helpers.each(dataset.points, function(point, index){
                    if (point.hasValue()){
                        point.transition({
                            y : this.scale.calculateY(point.value),
                            x : this.scale.calculateX(index)
                        }, easingDecimal);
                    }
                },this);

                //Draw the line between all the points
                ctx.lineWidth = this.options.datasetStrokeWidth;
                ctx.strokeStyle = dataset.strokeColor;
                ctx.beginPath();

                helpers.each(pointsWithValues, function(point, index){
                    if (index === 0){
                        ctx.moveTo(point.x, point.y);
                    }
                    else{
                        if (this.options.constantCurve){
                            var prevPoint = previousPoint(point, pointsWithValues, index);
                            if (prevPoint && prevPoint.y !== point.y) {
                                ctx.lineTo(point.x,prevPoint.y);
                                ctx.lineTo(point.x,point.y);
                            } else {
                                ctx.lineTo(point.x,point.y);
                            }
                        }
                        else{
                            ctx.lineTo(point.x,point.y);
                        }
                    }
                }, this);

                ctx.stroke();

                if (this.options.datasetFill && pointsWithValues.length > 0){
                    //Round off the line by going to the base of the chart, back to the start, then fill.
                    ctx.lineTo(pointsWithValues[pointsWithValues.length - 1].x, this.scale.endPoint);
                    ctx.lineTo(pointsWithValues[0].x, this.scale.endPoint);
                    ctx.fillStyle = dataset.fillColor;
                    ctx.closePath();
                    ctx.fill();
                }

                //Now draw the points over the line
                //A little inefficient double looping, but better than the line
                //lagging behind the point positions
                helpers.each(pointsWithValues,function(point){
                    point.draw();
                });
            },this);
        },
        buildScale : function(labels){
            var self = this;

            var dataTotal = function(){
                var values = [];
                self.eachPoints(function(point){
                    values.push(point.value);
                });

                return values;
            };

            var scaleOptions = {
                templateString : this.options.scaleLabel,
                height : this.chart.height,
                width : this.chart.width,
                ctx : this.chart.ctx,
                textColor : this.options.scaleFontColor,
                fontSize : this.options.scaleFontSize,
                fontStyle : this.options.scaleFontStyle,
                fontFamily : this.options.scaleFontFamily,
                valuesCount : labels.length,
                beginAtZero : this.options.scaleBeginAtZero,
                integersOnly : this.options.scaleIntegersOnly,
                calculateYRange : function(currentHeight){
                    var updatedRanges = helpers.calculateScaleRange(
                        dataTotal(),
                        currentHeight,
                        this.fontSize,
                        this.beginAtZero,
                        this.integersOnly
                    );
                    helpers.extend(this, updatedRanges);
                },
                xLabels : labels,
                font : helpers.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
                lineWidth : this.options.scaleLineWidth,
                lineColor : this.options.scaleLineColor,
                showHorizontalLines : this.options.scaleShowHorizontalLines,
                showVerticalLines : this.options.scaleShowVerticalLines,
                gridLineWidth : (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
                gridLineColor : (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
                padding: (this.options.showScale) ? 0 : this.options.pointDotRadius + this.options.pointDotStrokeWidth,
                showLabels : this.options.scaleShowLabels,
                display : this.options.showScale
            };

            if (this.options.scaleOverride){
                helpers.extend(scaleOptions, {
                    calculateYRange: helpers.noop,
                    steps: this.options.scaleSteps,
                    stepValue: this.options.scaleStepWidth,
                    min: this.options.scaleStartValue,
                    max: (this.options.scaleLabels) ? this.options.scaleLabels[this.options.scaleLabels.length - 1] : this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
                });
            }


            this.scale = new Chart.Scale(scaleOptions);
        },
        addData : function(valuesArray,label){
            //Map the values array for each of the datasets

            helpers.each(valuesArray,function(value,datasetIndex){
                //Add a new point for each piece of data, passing any required data to draw.
                this.datasets[datasetIndex].points.push(new this.PointClass({
                    value : value,
                    label : label,
                    x: this.scale.calculateX(this.scale.valuesCount+1),
                    y: this.scale.endPoint,
                    strokeColor : this.datasets[datasetIndex].pointStrokeColor,
                    fillColor : this.datasets[datasetIndex].pointColor
                }));
            },this);

            this.scale.addXLabel(label);
            //Then re-render the chart.
            //this.update(); // DON'T RE-RENDER FOR PERFORMANCE ISSUES
        },
        removeData : function(){
            this.scale.removeXLabel();
            //Then re-render the chart.
            helpers.each(this.datasets,function(dataset){
                dataset.points.shift();
            },this);
            //this.update(); // DON'T RE-RENDER FOR PERFORMANCE ISSUES
        },
        addDataArray : function(arrayOfValuesArray){
            //Map the values array for each of the datasets

            for (var i = 0, len = arrayOfValuesArray.length; i < len; ++i) {
                helpers.each(arrayOfValuesArray[i],function(value,datasetIndex){
                    //Add a new point for each piece of data, passing any required data to draw.
                    this.datasets[datasetIndex].points.push(new this.PointClass({
                        value : value,
                        label : '',
                        x: this.scale.calculateX(this.scale.valuesCount+1),
                        y: this.scale.endPoint,
                        strokeColor : this.datasets[datasetIndex].pointStrokeColor,
                        fillColor : this.datasets[datasetIndex].pointColor
                    }));
                },this);

                this.scale.addXLabel('');
            }
        }
});
