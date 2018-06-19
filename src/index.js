const Provider = require('oidc-provider');

const oidc = new Provider('http://localhost:3000');

const keystore = require('./keystore.json');

// http:/localhost:3000/auth?client_id=foo&response_type=code&scope=openid

// initialize with no keystores, dev ones will be provided
oidc.initialize({
  keystore,
  // just a foobar client to be able to start an Authentication Request
  clients: [{ client_id: 'foo', client_secret: 'bar', redirect_uris: ['http://lvh.me/cb'] }],
}).then(() => {
  oidc.listen(3000);
});
