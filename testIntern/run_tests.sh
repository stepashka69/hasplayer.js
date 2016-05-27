#!/bin/bash

PATH=$PATH:/usr/local/bin
npm install

node node_modules/intern/runner.js config=testIntern/testsCommon.js
# node node_modules/intern/runner.js config=testIntern/testsCommon.js browsers=chrome selenium=local
