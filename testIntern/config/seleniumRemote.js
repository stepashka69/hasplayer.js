define({
    proxyUrl: 'http://PC-selenium.rd.francetelecom.fr:3555',
    proxyPort: 3555,
    tunnel: 'NullTunnel',
    tunnelOptions: {
        hostname: 'PC-selenium.rd.francetelecom.fr',
        port: '4444',
        verbose: true
    },
    reporters: [{id: 'JUnit', filename: 'testIntern/test-reports/' + (new Date().getFullYear())+'-'+(new Date().getMonth()+1)+'-'+(new Date().getDate())+'_'+(new Date().getHours())+'-'+(new Date().getMinutes())+'-'+(new Date().getSeconds()) + '_report.xml'}],
    capabilities: {
        'selenium-version': '2.48.2'
    }
});