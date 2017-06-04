const user = require('./modules/user');

exports.register = (plugin, options, next) => {

  plugin.route([
    { method: 'GET', path: '/', config: user.hello },
    { method: 'GET', path: '/restricted', config: user.restricted },
    { method: 'GET', path: '/{path*}', config: user.notFound }
  ]);

  next();
};

exports.register.attributes = {
  name: 'api'
};