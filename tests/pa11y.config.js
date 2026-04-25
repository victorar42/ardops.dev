module.exports = {
  defaults: {
    standard: 'WCAG2AA',
    runners: ['axe', 'htmlcs'],
    timeout: 30000,
    wait: 2500,
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  },
  urls: [
    'http://localhost:8080/',
    'http://localhost:8080/blog/',
    'http://localhost:8080/talks/',
    'http://localhost:8080/404'
  ]
};
