function LoopTimer(callback, delay) {
    var timerId = null,
        startDate = null,
        remaining = delay,
        self = this;

    this.start = function() {
        startDate = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(function() {
            remaining = delay;
            self.start();
            callback();
        }, remaining);
    };

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - startDate;
    };

    this.resume = this.start;

    this.stop = function() {
        window.clearTimeout(timerId);
    };
}
