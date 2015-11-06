#!/bin/bash

PATH=$PATH:/usr/local/bin
npm install


node node_modules/intern/runner.js config=testIntern/demoPlayer/intern_common
results_test1=$?

node node_modules/intern/runner.js config=testIntern/demoPlayer/intern_ie
results_test2=$?

node node_modules/intern/runner.js config=testIntern/orangeHasPlayer/intern_common
results_test3=$?

node node_modules/intern/runner.js config=testIntern/orangeHasPlayer/intern_ie
results_test4=$?

node node_modules/intern/runner.js config=testIntern/orangeHasPlayer/intern_chrome
results_test5=$?

exit results_test1 && results_test2 && results_test3 && results_test4 && results_test5