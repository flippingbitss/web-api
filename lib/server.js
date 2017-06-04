import glue from 'glue'
import { manifest } from './config/manifest'


if (!process.env.PRODUCTION) {
  manifest.registrations.push({
    plugin: {
      register: "blipp",
      options: {}
    }
  });
}


glue.compose(manifest, { relativeTo: __dirname }, (err, server) => {
  if (err) {
    console.log('server.register err:', err);
  }
  server.start(() => {
    console.log('✅  Server is listening on ' + server.info.uri.toLowerCase());
  });
});