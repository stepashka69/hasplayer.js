define({
    proxyUrl: 'http://PC-selenium.rd.francetelecom.fr:3555',
    proxyPort: 3555,
    tunnel: 'NullTunnel',
    tunnelOptions: {
        hostname: 'PC-selenium.rd.francetelecom.fr',
        port: '4444',
        verbose: true
    },
    reporters: ['Runner'],
    capabilities: {
        'selenium-version': '2.48.2'
    }
});