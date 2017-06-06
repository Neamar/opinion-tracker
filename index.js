"use strict";
/* jshint asi: true */

const express = require('express')
const redis = require('redis')
const bodyParser = require('body-parser')
const app = express()
const RateLimit = require('express-rate-limit');

const client = redis.createClient(process.env.REDIS_URL || 'redis://localhost')

// Rate limit
app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)

var limiter = new RateLimit({
  windowMs: 500,
  max: 1, // limit each IP to 1 request per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});
app.use(limiter);

// Body parsing
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded()); // to support URL-encoded bodies


// Actual code
app.post('/vote', function(req, res) {
  if(!req.body.key) {
    res.send(409, 'Missing key')
    return
  }
  if(!req.body.vote) {
    res.send(409, 'Missing vote')
    return
  }

  const key = req.body.key
  const vote = parseInt(req.body.vote)

  if(vote !== -1 && vote !== 1) {
    res.send(409, 'Missing or invalid vote')
    return
  }

  client.hincrby('opinion-tracker', (vote === 1 ? 'good-' : 'bad-') + key, 1, function(err) {
    if(err) {
      console.warn(err);
      res.send(500, err.toString())
    }

    console.log("key=" + key + " vote=" + vote)

    res.send('Vote saved: ' + vote)
  })
})

app.get('/vote', function(req, res) {
  if(req.query.key !== process.env.KEY) {
    res.send(409, 'Missing key')
    return
  }

  client.hgetall('opinion-tracker', function(err, keys) {
    if(err) {
      console.warn(err);
      res.send(500, err.toString())
    }

    res.send(keys)
  })
});

const port = process.env.PORT || 3000
app.listen(port, function() {
  console.log(`App listening on port ${port}!`)
})
