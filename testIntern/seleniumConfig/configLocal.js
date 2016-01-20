define({
    proxyPort: 3555,

    // A fully qualified URL to the Intern proxy
    proxyUrl: 'http://127.0.0.1:3555',
    tunnel: 'NullTunnel',
    tunnelOptions: {
        hostname: '127.0.0.1',
        port: '4444',
        verbose: true
    },
    reporters: ['Runner'],
    capabilities: {
        'selenium-version': '2.48.2'
    }
});