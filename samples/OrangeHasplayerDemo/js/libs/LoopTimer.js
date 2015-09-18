function LoopTimer(callback, delay) {
    var timerId = null,
        elapsedTime = 0, // Theroic elapsed time
        startDate = null,
        timeoutDate = null,
        remaining = delay,
        diff = 0,
        self = this;

    this.start = function() {
        startDate = Date.now();
        elapsedTime = 0;
        this.tick();
    };

    this.tick = function() {
        timeoutDate = Date.now();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(function() {
            elapsedTime += delay; // Add theoric elapsed delay
            diff = (Date.now() - startDate) - elapsedTime;  // Measure difference between teoric elapsed time and system time
            remaining = delay - diff; // Apply diff to correct time drift
            self.tick();
            callback();
        }, remaining);
    };

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= Date.now() - timeoutDate;
    };

    this.resume = this.start;

    this.stop = function() {
        window.clearTimeout(timerId);
    };
}
