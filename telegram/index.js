import {
  apiKey,
  chatIDs,
} from './config';

const pad = (n, width, z) => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const camelToTitle = (str) => {
  var result = str.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const constructText = (obj) =>
  Object.keys(obj).map(key => key[0] === 'S' ?
    `*${key}*: ${obj[key]}` :
    `*${camelToTitle(key)}*: ${obj[key]}`).join('\n');

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  // const response = await fetch(`https://api.telegram.org/bot${apiKey}/getUpdates`);
  // const jsonObj = await response.json();

  const requestJSON = await request.json();

  const {
    eventType,
    movie,
    series,
  } = requestJSON || {};

  let output = '';

  if (movie) {
    const {
      movie: {
        title,
      },
    } = requestJSON || {};

    if (eventType === 'Rename') {
      output = constructText({
        eventType,
        title,
      });
    } else {
      const {
        release: {
          quality,
          releaseTitle,
        },
      } = requestJSON || {};

      output = constructText({
        eventType,
        title,
        quality,
        releaseTitle,
      });
    }
  }

  if (series) {
    const {
      series: {
        title,
      },
    } = requestJSON || {};

    if (eventType === 'Rename') {
      output = constructText({
        eventType,
        title,
      });
    } else {
      const {
        episodes,
      } = requestJSON || {};

      output = constructText(episodes.reduce((aggr, elem) => {
        const key = `S${pad(+elem.seasonNumber, 2)}E${pad(+elem.episodeNumber, 3)}`;
        const quality = elem.quality;
        return {
          ...aggr,
          [key]: quality,
        }
      }, {
        eventType,
        title
      }));
    }
  }


  await fetch(`https://api.telegram.org/bot${apiKey}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify({
      chat_id: chatIDs[0],
      text: JSON.stringify(requestJSON, null, 2),
      parse_mode: 'Markdown',
    }),
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  });

  await chatIDs.forEach(async chatID => {
    await fetch(`https://api.telegram.org/bot${apiKey}/sendMessage`, {
      method: 'POST',
      body: JSON.stringify({
        chat_id: chatID,
        text: output,
        parse_mode: 'Markdown',
      }),
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
  })

  return new Response(JSON.stringify({
    status: 'OK',
  }), {
    headers: {
      'content-type': 'text/json'
    },
  });
}