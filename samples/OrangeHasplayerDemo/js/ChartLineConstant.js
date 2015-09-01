var helpers = Chart.helpers;

Chart.types.Line.extend({
    // Passing in a name registers this chart in the Chart namespace in the same way
    name: "LineConstant",
    initialize: function(data){
        Chart.types.Line.prototype.initialize.apply(this, arguments);
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

