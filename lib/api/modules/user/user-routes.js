export const hello = {
  handler: function (request, reply) {
    return reply({ result: 'Hello hapi!' });
  }
};

export const restricted = {
  auth: 'jwt',
  handler: function (request, reply) {
    return reply({ result: 'Restricted!' });
  }
};

export const notFound = {
  handler: function (request, reply) {
    return reply({ result: 'Oops, 404 Page!' }).code(404);
  }
};