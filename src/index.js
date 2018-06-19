const Provider = require('oidc-provider');

// new Provider instance with no extra configuration, will run in default, just needs the issuer
// identifier, uses data from runtime-dyno-metadata heroku here
const oidc = new Provider('http://localhost:3000');

// initialize with no keystores, dev ones will be provided
oidc.initialize({
  // just a foobar client to be able to start an Authentication Request
  clients: [{ client_id: 'foo', client_secret: 'bar', redirect_uris: ['http://lvh.me/cb'] }],
}).then(() => {
  oidc.listen(3000);
});
