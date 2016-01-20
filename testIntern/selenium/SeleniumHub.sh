#!/bin/bash
DESC="Selenium Grid Server"
RUN_AS="selenium"
JAVA_BIN="/usr/bin/java"
 
SELENIUM_DIR="/selenium"
PID_FILE="$SELENIUM_DIR/selenium-grid.pid"
JAR_FILE="$SELENIUM_DIR/selenium-server-standalone-2.48.2.jar"
LOG_DIR="$SELENIUM_DIR/log"
LOG_FILE="${LOG_DIR}/selenium-grid.log"
 
USER="jenkins"
GROUP="jenkins"
 
MAX_MEMORY="-Xmx256m"
STACK_SIZE="-Xss8m"
 
DAEMON_OPTS=" $MAX_MEMORY $STACK_SIZE -jar $JAR_FILE -role hub -log $LOG_FILE"
 
NAME="selenium"
 
if [ "$1" != status ]; then
	if [ ! -d ${LOG_DIR} ]; then
		mkdir --mode 750 --parents ${LOG_DIR}
		chown ${USER}:${GROUP} ${LOG_DIR}
	fi
fi
 
 
# TODO: Put together /etc/init.d/xvfb
# export DISPLAY=:99.0
 
. /lib/lsb/init-functions
 
case "$1" in
	start)
		echo -n "Starting $DESC: "
		if start-stop-daemon -c $RUN_AS --start --background --pidfile $PID_FILE --make-pidfile --exec $JAVA_BIN -- $DAEMON_OPTS ; then
		log_end_msg 0
		else
		log_end_msg 1
		fi
		;;
	 
	stop)
		echo -n "Stopping $DESC: "
		start-stop-daemon --stop --pidfile $PID_FILE
		echo "$NAME."
		;;
	 
	restart|force-reload)
		echo -n "Restarting $DESC: "
		start-stop-daemon --stop --pidfile $PID_FILE
		sleep 1
		start-stop-daemon -c $RUN_AS --start --background --pidfile $PID_FILE --make-pidfile --exec $JAVA_BIN -- $DAEMON_OPTS
		echo "$NAME."
		;;
	 
	status)
		status_of_proc -p "$PID_FILE" "$DAEMON" "selenium" && exit 0 || exit $?
		;;
	 
	*)
		N=/etc/init.d/$NAME
		echo "Usage: $N {start|stop|restart|force-reload}" >&2
		exit 1
		;;
esac 